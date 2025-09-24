import asyncio
import concurrent.futures
import google.generativeai as genai
from typing import List, Dict, Tuple, Optional
import re
import numpy as np
import json
import hashlib
import time
import threading
import logging
from datetime import datetime

# Try to import ML libraries, fall back gracefully if not available
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import DBSCAN
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("Warning: scikit-learn not available. ML-based filtering will be disabled.")

logger = logging.getLogger('xenia')

class EnhancedTextExtractor:
    def __init__(self, gemini_api_key: str):
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        self.extraction_cache = {}
        self.thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)
        
    async def extract_and_process(self, file_content: str, file_type: str) -> Dict:
        """Fast parallel extraction and processing"""
        start_time = time.time()
        
        try:
            # Step 1: Quick pre-processing to remove obvious noise
            cleaned_content = await self._parallel_preprocess(file_content)
            
            # Step 2: Intelligent chunking for parallel processing
            chunks = self._smart_chunk(cleaned_content, max_chunk_size=3000)
            
            # Step 3: Parallel extraction with Gemini
            extraction_tasks = []
            for chunk in chunks:
                task = self._extract_topics_from_chunk(chunk)
                extraction_tasks.append(task)
            
            # Execute all extractions in parallel
            chunk_results = await asyncio.gather(*extraction_tasks, return_exceptions=True)
            
            # Filter out exceptions and get valid results
            valid_results = [result for result in chunk_results if not isinstance(result, Exception)]
            
            # Step 4: Merge and deduplicate results
            all_topics = self._merge_chunk_results(valid_results)
            
            # Step 5: Advanced filtering using ML (if available)
            if ML_AVAILABLE:
                filtered_topics = await self._ml_based_filtering(all_topics)
            else:
                filtered_topics = self._rule_based_filtering(all_topics)
            
            # Step 6: Final validation with Gemini
            validated_topics = await self._validate_with_gemini(filtered_topics)
            
            extraction_time = time.time() - start_time
            
            return {
                "topics": validated_topics,
                "extraction_time": round(extraction_time, 2),
                "confidence_scores": self._calculate_confidence(validated_topics),
                "chunks_processed": len(chunks),
                "total_topics_found": len(all_topics),
                "topics_after_filtering": len(filtered_topics),
                "final_topics": len(validated_topics)
            }
            
        except Exception as e:
            logger.error(f"Enhanced extraction failed: {e}")
            return {
                "topics": [],
                "extraction_time": time.time() - start_time,
                "error": str(e),
                "confidence_scores": {}
            }
    
    async def _parallel_preprocess(self, content: str) -> str:
        """Remove administrative noise in parallel"""
        
        # Define comprehensive noise patterns
        noise_patterns = [
            # Page and document metadata
            r'Page \d+',
            r'Copyright.*?\d{4}',
            r'All rights reserved',
            r'Table of Contents',
            r'Index',
            r'Bibliography',
            r'References',
            
            # Time and date patterns
            r'\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b.*?\d{1,2}:\d{2}',
            r'\d{1,2}/\d{1,2}/\d{2,4}',
            r'\d{1,2}-\d{1,2}-\d{2,4}',
            
            # Course administrative info
            r'Course Code:.*?\n',
            r'Instructor:.*?\n',
            r'Office Hours:.*?\n',
            r'Prerequisites:.*?\n',
            r'Credits:.*?\n',
            r'Grading Policy:.*?\n',
            r'Academic Integrity:.*?\n',
            r'Attendance Policy:.*?\n',
            
            # Contact information
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            r'\b\d{3}-\d{3}-\d{4}\b',
            r'\b\(\d{3}\)\s*\d{3}-\d{4}\b',
            
            # Room and building references
            r'Room \d+',
            r'Building [A-Z]',
            r'Office: .*?\n',
            
            # Course codes without content (standalone)
            r'\b[A-Z]{2,}\s+\d{3,4}\b(?!\s+[a-zA-Z])',
            
            # Percentage and grade patterns (when not part of content)
            r'^\d+%\s*$',
            r'Grade: [A-F][+-]?',
            
            # Header/footer patterns
            r'^[-=_]{3,}.*$',
            r'^\s*\d+\s*$',  # Standalone page numbers
        ]
        
        # Apply all patterns
        cleaned = content
        for pattern in noise_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.MULTILINE)
        
        # Remove excessive whitespace and normalize
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        cleaned = re.sub(r' {2,}', ' ', cleaned)
        cleaned = re.sub(r'\t+', ' ', cleaned)
        
        return cleaned.strip()
    
    def _smart_chunk(self, content: str, max_chunk_size: int) -> List[str]:
        """Intelligent content chunking that preserves context"""
        
        # Split by major sections first
        section_markers = [
            '\n\n', '\nChapter', '\nSection', '\nModule', '\nUnit', 
            '\nWeek', '\nLesson', '\nTopic', '\n#', '\n##'
        ]
        
        chunks = []
        current_chunk = ""
        
        # Try to keep related content together
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if adding this line would exceed chunk size
            if len(current_chunk) + len(line) + 1 > max_chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = line
            else:
                if current_chunk:
                    current_chunk += '\n' + line
                else:
                    current_chunk = line
        
        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Filter out very short chunks (likely noise)
        chunks = [chunk for chunk in chunks if len(chunk.split()) >= 5]
        
        return chunks
    
    async def _extract_topics_from_chunk(self, chunk: str) -> List[Dict]:
        """Extract topics from a single chunk using Gemini"""
        
        prompt = f"""
        Extract ONLY the academic topics and concepts that would be taught or learned from the following content.
        
        STRICT RULES:
        1. Include ONLY educational topics/concepts (no administrative info)
        2. Each topic should be 2-6 words maximum
        3. Remove duplicates and similar topics
        4. Focus on subject matter content only
        5. Ignore dates, times, instructor names, grading policies, contact info
        6. Ignore course codes unless they're part of actual topic names
        
        Content:
        {chunk[:2000]}
        
        Return ONLY a JSON array of topic strings, nothing else:
        ["Topic 1", "Topic 2", "Topic 3"]
        
        Topics:
        """
        
        try:
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,  # Lower temperature for more focused extraction
                    top_p=0.8,
                    max_output_tokens=500,
                )
            )
            
            # Parse response more robustly
            response_text = response.text.strip()
            
            # Try to extract JSON array
            json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if json_match:
                try:
                    topics_list = json.loads(json_match.group(0))
                    if isinstance(topics_list, list):
                        # Convert to our format and validate
                        topics = []
                        for topic in topics_list:
                            if isinstance(topic, str) and 2 <= len(topic.split()) <= 6:
                                topics.append({
                                    'name': topic.strip(),
                                    'source_chunk': chunk[:100],
                                    'confidence': 0.5  # Base confidence
                                })
                        return topics
                except json.JSONDecodeError:
                    pass
            
            # Fallback: parse line by line
            topics = []
            for line in response_text.split('\n'):
                line = line.strip()
                # Remove quotes, brackets, numbers, bullets
                line = re.sub(r'^[\d\.\-\*\"\'\[\]]+\s*', '', line)
                line = re.sub(r'[\"\'\[\]]+$', '', line)
                line = line.strip()
                
                if line and 2 <= len(line.split()) <= 6:
                    topics.append({
                        'name': line,
                        'source_chunk': chunk[:100],
                        'confidence': 0.4  # Lower confidence for fallback parsing
                    })
            
            return topics[:10]  # Limit to top 10 topics per chunk
            
        except Exception as e:
            logger.error(f"Chunk extraction error: {e}")
            return []
    
    def _merge_chunk_results(self, chunk_results: List[List[Dict]]) -> List[Dict]:
        """Merge and deduplicate topics from all chunks"""
        
        topic_map = {}
        
        for chunk_topics in chunk_results:
            for topic in chunk_topics:
                topic_key = topic['name'].lower().strip()
                
                if topic_key not in topic_map:
                    topic_map[topic_key] = topic.copy()
                    topic_map[topic_key]['occurrences'] = 1
                else:
                    # Topic appeared multiple times - increase confidence
                    topic_map[topic_key]['confidence'] = min(1.0, topic_map[topic_key]['confidence'] + 0.2)
                    topic_map[topic_key]['occurrences'] += 1
        
        return list(topic_map.values())
    
    async def _ml_based_filtering(self, topics: List[Dict]) -> List[Dict]:
        """Use ML to filter out noise and irrelevant topics"""
        
        if not topics or not ML_AVAILABLE:
            return topics
        
        try:
            # Extract topic names for vectorization
            topic_names = [t['name'] for t in topics]
            
            if len(topic_names) < 3:  # Need at least 3 topics for clustering
                return self._rule_based_filtering(topics)
            
            # TF-IDF Vectorization
            vectorizer = TfidfVectorizer(
                max_features=100,
                ngram_range=(1, 3),
                stop_words='english',
                min_df=1,
                max_df=0.8
            )
            
            tfidf_matrix = vectorizer.fit_transform(topic_names)
            
            # Use DBSCAN clustering to identify outliers (likely noise)
            clustering = DBSCAN(eps=0.4, min_samples=2, metric='cosine')
            clusters = clustering.fit_predict(tfidf_matrix)
            
            # Filter topics based on clustering results
            filtered_topics = []
            for i, topic in enumerate(topics):
                cluster_label = clusters[i]
                
                # Keep topics that are in clusters (not outliers)
                if cluster_label != -1:
                    topic['confidence'] += 0.2
                    topic['cluster'] = int(cluster_label)
                    filtered_topics.append(topic)
                # Give outliers a second chance with rule-based validation
                elif self._is_likely_valid_topic(topic['name']):
                    topic['confidence'] += 0.1
                    topic['cluster'] = -1
                    filtered_topics.append(topic)
            
            logger.info(f"ML filtering: {len(topics)} -> {len(filtered_topics)} topics")
            return filtered_topics
            
        except Exception as e:
            logger.error(f"ML filtering error: {e}")
            return self._rule_based_filtering(topics)
    
    def _rule_based_filtering(self, topics: List[Dict]) -> List[Dict]:
        """Rule-based filtering as fallback when ML is not available"""
        
        filtered_topics = []
        
        for topic in topics:
            if self._is_likely_valid_topic(topic['name']):
                topic['confidence'] += 0.1
                filtered_topics.append(topic)
        
        return filtered_topics
    
    def _is_likely_valid_topic(self, topic_name: str) -> bool:
        """Rule-based validation for topic relevance"""
        
        # Common academic topic patterns
        valid_patterns = [
            # Subject-specific patterns
            r'.*(?:Theory|Analysis|Design|System|Method|Algorithm|Process|Model|Principle)',
            r'.*(?:Introduction to|Fundamentals of|Advanced|Basic|Elementary)',
            r'(?:Data|Database|Programming|Software|Hardware|Network|Computer)',
            r'(?:Mathematics|Math|Physics|Chemistry|Biology|Science)',
            r'(?:Machine Learning|AI|Deep Learning|Neural|Artificial)',
            r'(?:Calculus|Algebra|Geometry|Statistics|Probability)',
            r'(?:Literature|Writing|Grammar|Essay|Poetry)',
            r'(?:History|Geography|Economics|Psychology|Sociology)',
            
            # General academic terms
            r'.*(?:Concepts|Techniques|Applications|Implementation)',
            r'.*(?:Research|Study|Learning|Teaching|Education)',
        ]
        
        # Noise patterns to exclude
        noise_patterns = [
            r'^\d+$',  # Just numbers
            r'^Week \d+$',
            r'^Chapter \d+$',
            r'^Page \d+$',
            r'.*@.*',  # Email addresses
            r'^\w{1,2}$',  # Too short (1-2 characters)
            r'.*\d{2}:\d{2}',  # Time patterns
            r'^(Office|Hours|Email|Phone|Room|Building|Address)$',
            r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$',
            r'^\d+%$',  # Percentage only
            r'^Grade [A-F]$',
            r'^[A-Z]{2,}\s+\d{3,4}$',  # Course codes only
            r'^(and|or|the|of|in|on|at|to|for|with|by)$',  # Common words only
        ]
        
        # Check against noise patterns first
        for pattern in noise_patterns:
            if re.match(pattern, topic_name, re.IGNORECASE):
                return False
        
        # Check against valid patterns
        for pattern in valid_patterns:
            if re.search(pattern, topic_name, re.IGNORECASE):
                return True
        
        # Additional heuristics
        words = topic_name.split()
        
        # Must have reasonable word count
        if not (2 <= len(words) <= 6):
            return False
        
        # Should not start with numbers (unless it's a meaningful number)
        if words[0].isdigit() and len(words[0]) < 4:
            return False
        
        # Should contain at least one meaningful word (not all prepositions/articles)
        meaningful_words = [w for w in words if len(w) > 2 and w.lower() not in ['the', 'and', 'for', 'with', 'from']]
        if len(meaningful_words) == 0:
            return False
        
        return True
    
    async def _validate_with_gemini(self, topics: List[Dict]) -> List[Dict]:
        """Final validation pass with Gemini for high accuracy"""
        
        if not topics:
            return []
        
        # Batch topics for validation (max 20 at a time)
        batch_size = 20
        validated_topics = []
        
        for i in range(0, len(topics), batch_size):
            batch = topics[i:i + batch_size]
            batch_names = [t['name'] for t in batch]
            
            validation_prompt = f"""
            Review these extracted topics and identify which are ACTUAL ACADEMIC LEARNING TOPICS vs administrative content or noise.
            
            Topics to validate:
            {json.dumps(batch_names, indent=2)}
            
            For each topic, respond with ONLY "VALID" or "INVALID".
            
            VALID = actual subject/concept that students learn
            INVALID = administrative info, noise, or non-educational content
            
            Be strict - only mark as VALID if it's clearly an academic topic.
            
            Format: Return a JSON array of "VALID" or "INVALID" in the same order:
            ["VALID", "INVALID", "VALID", ...]
            """
            
            try:
                response = await asyncio.to_thread(
                    self.model.generate_content,
                    validation_prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=0.1,  # Very low temperature for consistency
                        top_p=0.9,
                        max_output_tokens=200,
                    )
                )
                
                # Parse validation results
                response_text = response.text.strip()
                json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
                
                if json_match:
                    try:
                        validations = json.loads(json_match.group(0))
                        if isinstance(validations, list) and len(validations) == len(batch):
                            for j, validation in enumerate(validations):
                                if validation == "VALID":
                                    topic = batch[j].copy()
                                    topic['confidence'] = min(1.0, topic['confidence'] + 0.3)
                                    validated_topics.append(topic)
                        continue
                    except json.JSONDecodeError:
                        pass
                
                # Fallback: assume all are valid but with lower confidence
                for topic in batch:
                    topic['confidence'] = max(0.1, topic['confidence'] - 0.2)
                    validated_topics.append(topic)
                    
            except Exception as e:
                logger.error(f"Gemini validation error: {e}")
                # Fallback to confidence-based filtering
                for topic in batch:
                    if topic['confidence'] > 0.4:
                        validated_topics.append(topic)
        
        # Sort by confidence and return top topics
        validated_topics.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Limit to reasonable number of topics
        max_topics = min(50, max(10, len(validated_topics) // 2))
        final_topics = validated_topics[:max_topics]
        
        logger.info(f"Final validation: {len(topics)} -> {len(final_topics)} topics")
        return final_topics
    
    def _calculate_confidence(self, topics: List[Dict]) -> Dict[str, float]:
        """Calculate confidence scores for topics"""
        confidence_scores = {}
        
        for topic in topics:
            confidence_scores[topic['name']] = topic.get('confidence', 0.5)
        
        return confidence_scores
    
    def _calculate_time(self) -> float:
        """Placeholder for timing calculation"""
        return 0.0
