"""Enhanced resource recommendation service.
Fetches external educational resources with AI-powered personalization, quality scoring,
and comprehensive content discovery from multiple sources including Hugging Face.
"""
from __future__ import annotations
import os
import json
import time
import urllib.parse
from typing import List, Dict, Any, Optional
import httpx
from ..supabase_client import get_supabase

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")  # Optional; if absent use search scraping fallback
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_FIELDS = "items(id/videoId,snippet/title,snippet/channelTitle,snippet/publishedAt,snippet/description)"

# Enhanced catalog sources with quality ratings
OPENCOURSEWARE_INDEX = [
    {"title": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "quality": 9, "type": "university"},
    {"title": "Khan Academy", "url": "https://www.khanacademy.org", "quality": 9, "type": "interactive"},
    {"title": "Coursera Free Courses", "url": "https://www.coursera.org/courses?query={query}", "quality": 8, "type": "mooc"},
    {"title": "edX", "url": "https://www.edx.org/search?q={query}", "quality": 8, "type": "mooc"},
    {"title": "freeCodeCamp", "url": "https://www.freecodecamp.org", "quality": 8, "type": "interactive"},
    {"title": "Codecademy", "url": "https://www.codecademy.com", "quality": 7, "type": "interactive"},
    {"title": "W3Schools", "url": "https://www.w3schools.com", "quality": 7, "type": "reference"},
    {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "quality": 9, "type": "reference"},
]

# Enhanced documentation sources with subject-specific resources
DOC_SOURCES = [
    ("wikipedia", "https://en.wikipedia.org/wiki/{query}", 6),
    ("wikibooks", "https://en.wikibooks.org/wiki/{query}", 7),
    ("stack_overflow", "https://stackoverflow.com/search?q={query}", 8),
    ("github", "https://github.com/search?q={query}", 7),
    ("medium", "https://medium.com/search?q={query}", 6),
    ("dev_to", "https://dev.to/search?q={query}", 7),
]

# Subject-specific resource pools
SUBJECT_RESOURCES = {
    "mathematics": [
        {"name": "Wolfram MathWorld", "url": "https://mathworld.wolfram.com", "quality": 9, "description": "Comprehensive mathematical encyclopedia"},
        {"name": "Paul's Online Math Notes", "url": "https://tutorial.math.lamar.edu", "quality": 8, "description": "Free calculus and algebra tutorials"},
        {"name": "3Blue1Brown", "url": "https://www.3blue1brown.com", "quality": 9, "description": "Visual mathematics explanations"},
        {"name": "Desmos Calculator", "url": "https://www.desmos.com/calculator", "quality": 8, "description": "Interactive graphing calculator"},
        {"name": "Khan Academy Math", "url": "https://www.khanacademy.org/math", "quality": 9, "description": "Free math courses from basic to advanced"},
        {"name": "Brilliant Math", "url": "https://brilliant.org/courses/mathematics/", "quality": 8, "description": "Interactive math problem solving"},
        {"name": "Mathway", "url": "https://www.mathway.com", "quality": 7, "description": "Step-by-step math problem solver"},
    ],
    "programming": [
        {"name": "LeetCode", "url": "https://leetcode.com", "quality": 9, "description": "Coding interview preparation platform"},
        {"name": "HackerRank", "url": "https://www.hackerrank.com", "quality": 8, "description": "Coding challenges and skill assessment"},
        {"name": "freeCodeCamp", "url": "https://www.freecodecamp.org", "quality": 9, "description": "Free coding bootcamp with certifications"},
        {"name": "Codecademy", "url": "https://www.codecademy.com", "quality": 8, "description": "Interactive coding lessons"},
        {"name": "Replit", "url": "https://replit.com", "quality": 7, "description": "Online IDE for coding practice"},
        {"name": "CodePen", "url": "https://codepen.io", "quality": 7, "description": "Front-end code playground"},
        {"name": "GitHub Learning Lab", "url": "https://lab.github.com", "quality": 8, "description": "Interactive GitHub learning courses"},
        {"name": "Exercism", "url": "https://exercism.org", "quality": 8, "description": "Mentored coding exercises in 50+ languages"},
    ],
    "science": [
        {"name": "Khan Academy Science", "url": "https://www.khanacademy.org/science", "quality": 9, "description": "Comprehensive science education"},
        {"name": "Crash Course", "url": "https://www.youtube.com/c/crashcourse", "quality": 9, "description": "Fast-paced science video series"},
        {"name": "SciShow", "url": "https://www.youtube.com/c/scishow", "quality": 8, "description": "Science news and explanations"},
        {"name": "National Geographic", "url": "https://www.nationalgeographic.com", "quality": 8, "description": "Science and nature documentaries"},
        {"name": "PhET Interactive Simulations", "url": "https://phet.colorado.edu", "quality": 9, "description": "Interactive physics and chemistry simulations"},
        {"name": "BioInteractive", "url": "https://www.biointeractive.org", "quality": 8, "description": "Biology teaching resources from HHMI"},
        {"name": "NASA Education", "url": "https://www.nasa.gov/audience/foreducators", "quality": 8, "description": "Space science and STEM resources"},
    ],
    "language": [
        {"name": "Duolingo", "url": "https://www.duolingo.com", "quality": 9, "description": "Gamified language learning platform"},
        {"name": "Memrise", "url": "https://www.memrise.com", "quality": 8, "description": "Spaced repetition language learning"},
        {"name": "BBC Languages", "url": "https://www.bbc.co.uk/languages", "quality": 7, "description": "Free language learning courses"},
        {"name": "SparkNotes Literature", "url": "https://www.sparknotes.com/lit", "quality": 7, "description": "Literature study guides and analysis"},
        {"name": "Grammar Girl", "url": "https://www.quickanddirtytips.com/grammar-girl", "quality": 7, "description": "Grammar and writing tips podcast"},
        {"name": "Purdue OWL", "url": "https://owl.purdue.edu", "quality": 8, "description": "Online writing lab and grammar resources"},
        {"name": "Merriam-Webster", "url": "https://www.merriam-webster.com", "quality": 8, "description": "Dictionary and thesaurus with word games"},
    ],
    "business": [
        {"name": "Khan Academy Business", "url": "https://www.khanacademy.org/economics-finance-domain", "quality": 8, "description": "Business and economics education"},
        {"name": "Coursera Business", "url": "https://www.coursera.org/browse/business", "quality": 8, "description": "Business courses from top universities"},
        {"name": "edX Business", "url": "https://www.edx.org/learn/business", "quality": 8, "description": "Business and management courses"},
        {"name": "Investopedia", "url": "https://www.investopedia.com", "quality": 8, "description": "Financial education and market analysis"},
    ],
    "history": [
        {"name": "Khan Academy History", "url": "https://www.khanacademy.org/humanities", "quality": 8, "description": "World history and humanities"},
        {"name": "Crash Course History", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNjasccl-WajpONGX3zoY4", "quality": 8, "description": "World history video series"},
        {"name": "BBC History", "url": "https://www.bbc.co.uk/history", "quality": 7, "description": "Historical documentaries and articles"},
    ],
    "art": [
        {"name": "Khan Academy Art", "url": "https://www.khanacademy.org/humanities/art-history", "quality": 8, "description": "Art history and appreciation"},
        {"name": "The Metropolitan Museum of Art", "url": "https://www.metmuseum.org/learn", "quality": 8, "description": "Art education resources"},
        {"name": "Smarthistory", "url": "https://smarthistory.org", "quality": 8, "description": "Art history teaching resources"},
    ]
}

# Topic-specific resource mapping for syllabus topics
TOPIC_SPECIFIC_RESOURCES = {
    # Mathematics Topics
    "linear algebra": [
        {"name": "3Blue1Brown Linear Algebra", "url": "https://www.3blue1brown.com/topics/linear-algebra", "quality": 10, "description": "Visual linear algebra explanations"},
        {"name": "Khan Academy Linear Algebra", "url": "https://www.khanacademy.org/math/linear-algebra", "quality": 9, "description": "Comprehensive linear algebra course"},
        {"name": "MIT Linear Algebra", "url": "https://ocw.mit.edu/courses/mathematics/18-06-linear-algebra-spring-2010/", "quality": 9, "description": "MIT's legendary linear algebra course"},
        {"name": "Gilbert Strang Lectures", "url": "https://www.youtube.com/playlist?list=PL49CF3715CB9EF31D", "quality": 9, "description": "MIT professor's linear algebra lectures"},
    ],
    "calculus": [
        {"name": "Khan Academy Calculus", "url": "https://www.khanacademy.org/math/calculus-1", "quality": 9, "description": "Complete calculus curriculum"},
        {"name": "Paul's Online Calculus Notes", "url": "https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx", "quality": 8, "description": "Detailed calculus tutorials"},
        {"name": "3Blue1Brown Calculus", "url": "https://www.3blue1brown.com/topics/calculus", "quality": 9, "description": "Visual calculus explanations"},
        {"name": "MIT Calculus", "url": "https://ocw.mit.edu/courses/mathematics/18-01sc-single-variable-calculus-fall-2010/", "quality": 9, "description": "MIT single variable calculus"},
    ],
    "differential equations": [
        {"name": "Khan Academy Differential Equations", "url": "https://www.khanacademy.org/math/differential-equations", "quality": 8, "description": "Differential equations course"},
        {"name": "Paul's Online Diff Eq Notes", "url": "https://tutorial.math.lamar.edu/Classes/DE/DE.aspx", "quality": 8, "description": "Comprehensive differential equations"},
        {"name": "MIT Differential Equations", "url": "https://ocw.mit.edu/courses/mathematics/18-03sc-differential-equations-fall-2011/", "quality": 9, "description": "MIT differential equations course"},
    ],
    "probability": [
        {"name": "Khan Academy Probability", "url": "https://www.khanacademy.org/math/probability", "quality": 9, "description": "Complete probability curriculum"},
        {"name": "StatQuest Probability", "url": "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsCd", "quality": 8, "description": "Visual probability explanations"},
        {"name": "MIT Probability", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/", "quality": 9, "description": "MIT probability course"},
    ],
    "statistics": [
        {"name": "Khan Academy Statistics", "url": "https://www.khanacademy.org/math/statistics-probability", "quality": 9, "description": "Statistics and probability"},
        {"name": "StatQuest Statistics", "url": "https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsCd", "quality": 8, "description": "Statistical concepts explained visually"},
        {"name": "Coursera Statistics", "url": "https://www.coursera.org/learn/basic-statistics", "quality": 8, "description": "Statistics courses from top universities"},
    ],

    # Programming Topics
    "data structures": [
        {"name": "MIT Data Structures", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-006-introduction-to-algorithms-fall-2011/", "quality": 9, "description": "MIT algorithms and data structures"},
        {"name": "GeeksforGeeks DSA", "url": "https://www.geeksforgeeks.org/data-structures/", "quality": 8, "description": "Comprehensive data structures guide"},
        {"name": "Visualgo", "url": "https://visualgo.net/en", "quality": 8, "description": "Interactive algorithm visualizations"},
        {"name": "Khan Academy Algorithms", "url": "https://www.khanacademy.org/computing/computer-science/algorithms", "quality": 8, "description": "Algorithm fundamentals"},
    ],
    "algorithms": [
        {"name": "MIT Algorithms", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-006-introduction-to-algorithms-fall-2011/", "quality": 9, "description": "MIT introduction to algorithms"},
        {"name": "Khan Academy Algorithms", "url": "https://www.khanacademy.org/computing/computer-science/algorithms", "quality": 8, "description": "Algorithm tutorials"},
        {"name": "GeeksforGeeks Algorithms", "url": "https://www.geeksforgeeks.org/fundamentals-of-algorithms/", "quality": 8, "description": "Algorithm implementations"},
        {"name": "Coursera Algorithms", "url": "https://www.coursera.org/specializations/algorithms", "quality": 9, "description": "Stanford algorithms specialization"},
    ],
    "machine learning": [
        {"name": "Coursera ML", "url": "https://www.coursera.org/learn/machine-learning", "quality": 10, "description": "Andrew Ng's machine learning course"},
        {"name": "fast.ai", "url": "https://www.fast.ai/", "quality": 9, "description": "Practical deep learning"},
        {"name": "MIT Machine Learning", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-034-artificial-intelligence-fall-2010/", "quality": 8, "description": "MIT AI and machine learning"},
        {"name": "Google ML Crash Course", "url": "https://developers.google.com/machine-learning/crash-course", "quality": 8, "description": "Google's ML fundamentals"},
    ],
    "web development": [
        {"name": "MDN Web Docs", "url": "https://developer.mozilla.org/en-US/docs/Learn", "quality": 9, "description": "Mozilla's web development learning"},
        {"name": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/responsive-web-design/", "quality": 9, "description": "Full web development curriculum"},
        {"name": "The Odin Project", "url": "https://www.theodinproject.com/", "quality": 8, "description": "Open source web development curriculum"},
        {"name": "Codecademy Web", "url": "https://www.codecademy.com/catalog/language/html-css", "quality": 8, "description": "Interactive web development"},
    ],
    "python programming": [
        {"name": "Python Official Tutorial", "url": "https://docs.python.org/3/tutorial/", "quality": 9, "description": "Official Python tutorial"},
        {"name": "Automate the Boring Stuff", "url": "https://automatetheboringstuff.com/", "quality": 8, "description": "Practical Python programming"},
        {"name": "Codecademy Python", "url": "https://www.codecademy.com/learn/learn-python-3", "quality": 8, "description": "Interactive Python course"},
        {"name": "MIT Python", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/", "quality": 9, "description": "MIT introduction to Python"},
    ],

    # Science Topics
    "physics": [
        {"name": "Khan Academy Physics", "url": "https://www.khanacademy.org/science/physics", "quality": 9, "description": "Complete physics curriculum"},
        {"name": "MIT Physics", "url": "https://ocw.mit.edu/courses/physics/", "quality": 9, "description": "MIT physics courses"},
        {"name": "PhET Physics", "url": "https://phet.colorado.edu/en/simulations/category/physics", "quality": 9, "description": "Interactive physics simulations"},
        {"name": "Crash Course Physics", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0ge7yDk_UA0ldZJdhwko", "quality": 8, "description": "Physics video series"},
    ],
    "chemistry": [
        {"name": "Khan Academy Chemistry", "url": "https://www.khanacademy.org/science/chemistry", "quality": 9, "description": "Chemistry fundamentals"},
        {"name": "MIT Chemistry", "url": "https://ocw.mit.edu/courses/chemistry/", "quality": 9, "description": "MIT chemistry courses"},
        {"name": "PhET Chemistry", "url": "https://phet.colorado.edu/en/simulations/category/chemistry", "quality": 9, "description": "Interactive chemistry simulations"},
        {"name": "Crash Course Chemistry", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWy6fYEaX9mQQ8oGr", "quality": 8, "description": "Chemistry video series"},
    ],
    "biology": [
        {"name": "Khan Academy Biology", "url": "https://www.khanacademy.org/science/biology", "quality": 9, "description": "Biology curriculum"},
        {"name": "MIT Biology", "url": "https://ocw.mit.edu/courses/biology/", "quality": 9, "description": "MIT biology courses"},
        {"name": "BioInteractive", "url": "https://www.biointeractive.org/", "quality": 8, "description": "HHMI biology resources"},
        {"name": "Crash Course Biology", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtPWn0KrZb5FCiJq2JGc2HO7", "quality": 8, "description": "Biology video series"},
    ],

    # Computer Science Topics
    "computer networks": [
        {"name": "Khan Academy Networks", "url": "https://www.khanacademy.org/computing/computer-science/internet-intro", "quality": 8, "description": "Computer networking basics"},
        {"name": "MIT Networks", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-02-introduction-to-eecs-i-fall-2010/", "quality": 9, "description": "MIT computer engineering"},
        {"name": "Beej's Network Programming", "url": "https://beej.us/guide/bgnet/", "quality": 8, "description": "Network programming guide"},
    ],
    "operating systems": [
        {"name": "MIT OS", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-828-operating-system-engineering-fall-2012/", "quality": 9, "description": "MIT operating systems"},
        {"name": "Stanford OS", "url": "https://web.stanford.edu/~ouster/cgi-bin/cs140-spring14/index.php", "quality": 9, "description": "Stanford operating systems"},
        {"name": "OSDev Wiki", "url": "https://wiki.osdev.org/Main_Page", "quality": 8, "description": "OS development resources"},
    ],
    "database systems": [
        {"name": "Stanford DB", "url": "https://web.stanford.edu/class/cs145/", "quality": 9, "description": "Stanford database systems"},
        {"name": "MIT DB", "url": "https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-830-database-systems-fall-2010/", "quality": 9, "description": "MIT database systems"},
        {"name": "SQLZoo", "url": "https://sqlzoo.net/", "quality": 8, "description": "Interactive SQL learning"},
    ],

    # Business Topics
    "finance": [
        {"name": "Khan Academy Finance", "url": "https://www.khanacademy.org/economics-finance-domain/core-finance", "quality": 8, "description": "Finance fundamentals"},
        {"name": "Investopedia", "url": "https://www.investopedia.com/", "quality": 8, "description": "Financial education"},
        {"name": "Coursera Finance", "url": "https://www.coursera.org/browse/business/finance", "quality": 8, "description": "Finance courses"},
    ],
    "marketing": [
        {"name": "Khan Academy Marketing", "url": "https://www.khanacademy.org/economics-finance-domain/core-finance/pf-saving-and-investing", "quality": 7, "description": "Marketing basics"},
        {"name": "Coursera Marketing", "url": "https://www.coursera.org/browse/business/marketing", "quality": 8, "description": "Marketing courses"},
        {"name": "HubSpot Academy", "url": "https://academy.hubspot.com/", "quality": 8, "description": "Marketing certification"},
    ],
    "economics": [
        {"name": "Khan Academy Economics", "url": "https://www.khanacademy.org/economics-finance-domain", "quality": 8, "description": "Economics curriculum"},
        {"name": "MIT Economics", "url": "https://ocw.mit.edu/courses/economics/", "quality": 9, "description": "MIT economics courses"},
        {"name": "Crash Course Economics", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtPNySztEg6o8F7nkyXKiqMj", "quality": 8, "description": "Economics video series"},
    ],

    # Language Topics
    "english literature": [
        {"name": "SparkNotes Literature", "url": "https://www.sparknotes.com/lit/", "quality": 7, "description": "Literature study guides"},
        {"name": "Khan Academy Literature", "url": "https://www.khanacademy.org/humanities", "quality": 8, "description": "Literature and humanities"},
        {"name": "MIT Literature", "url": "https://ocw.mit.edu/courses/literature/", "quality": 8, "description": "MIT literature courses"},
    ],
    "writing": [
        {"name": "Purdue OWL", "url": "https://owl.purdue.edu/", "quality": 8, "description": "Online writing lab"},
        {"name": "Grammarly", "url": "https://www.grammarly.com/grammar", "quality": 7, "description": "Writing and grammar"},
        {"name": "Hemingway App", "url": "http://www.hemingwayapp.com/", "quality": 7, "description": "Writing improvement tool"},
    ],
}

HEADERS = {"User-Agent": "XENIA-EduBot/1.0 (+https://example.com)"}

HUGGINGFACE_RESOURCES = {
    "models": [
        {
            "name": "MerlynMind Education Models",
            "url": "https://hf.co/MerlynMind",
            "description": "Specialized models for educational content generation and QA",
            "quality": 9,
            "category": "text-generation",
            "tags": ["education", "qa", "content-generation"]
        },
        {
            "name": "Princeton NLP Educational Models",
            "url": "https://hf.co/princeton-nlp",
            "description": "Research models focused on educational value and learning",
            "quality": 8,
            "category": "text-generation",
            "tags": ["education", "research", "learning"]
        },
        {
            "name": "Educational Chatbots",
            "url": "https://hf.co/spaces/phani50101/Educational-bot",
            "description": "Interactive educational chatbot for lesson planning",
            "quality": 7,
            "category": "chatbot",
            "tags": ["education", "lesson-planning", "interactive"]
        }
    ],
    "datasets": [
        {
            "name": "British Educational Prompts",
            "url": "https://hf.co/datasets/roneymatusp/british-educational-prompts",
            "description": "Curated educational prompts for British International Schools",
            "quality": 8,
            "category": "education",
            "tags": ["prompts", "curriculum", "british-english"]
        },
        {
            "name": "Education Parallel Data",
            "url": "https://hf.co/datasets/mbazaNLP/NMT_Education_parallel_data_en_kin",
            "description": "Translation dataset for educational content",
            "quality": 7,
            "category": "translation",
            "tags": ["education", "translation", "multilingual"]
        },
        {
            "name": "K-12 Education Data",
            "url": "https://hf.co/datasets/ruiiw/k-12_education_data",
            "description": "Educational data for K-12 curriculum",
            "quality": 7,
            "category": "education",
            "tags": ["k-12", "curriculum", "data"]
        }
    ],
    "papers": [
        {
            "name": "LearnLM: Improving Gemini for Learning",
            "url": "https://hf.co/papers/2412.16429",
            "description": "Framework for pedagogical instruction following in LLMs",
            "quality": 9,
            "category": "pedagogy",
            "tags": ["llm", "pedagogy", "instruction-following"]
        },
        {
            "name": "CLASS Meet SPOCK: Education Tutoring Chatbot",
            "url": "https://hf.co/papers/2305.13272",
            "description": "Design framework for high-performance tutoring systems",
            "quality": 8,
            "category": "tutoring",
            "tags": ["tutoring", "chatbot", "learning-science"]
        },
        {
            "name": "Health Text Simplification for Education",
            "url": "https://hf.co/papers/2401.15043",
            "description": "Text simplification models for educational health content",
            "quality": 8,
            "category": "text-simplification",
            "tags": ["health-education", "text-simplification", "accessibility"]
        }
    ]
}

HEADERS = {"User-Agent": "XENIA-EduBot/1.0 (+https://example.com)"}
from ..supabase_client import get_supabase

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")  # Optional; if absent use search scraping fallback
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_FIELDS = "items(id/videoId,snippet/title,snippet/channelTitle,snippet/publishedAt,snippet/description)"

# Enhanced catalog sources with quality ratings
OPENCOURSEWARE_INDEX = [
    {"title": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "quality": 9, "type": "university"},
    {"title": "Khan Academy", "url": "https://www.khanacademy.org", "quality": 9, "type": "interactive"},
    {"title": "Coursera Free Courses", "url": "https://www.coursera.org/courses?query={query}", "quality": 8, "type": "mooc"},
    {"title": "edX", "url": "https://www.edx.org/search?q={query}", "quality": 8, "type": "mooc"},
    {"title": "freeCodeCamp", "url": "https://www.freecodecamp.org", "quality": 8, "type": "interactive"},
    {"title": "Codecademy", "url": "https://www.codecademy.com", "quality": 7, "type": "interactive"},
    {"title": "W3Schools", "url": "https://www.w3schools.com", "quality": 7, "type": "reference"},
    {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "quality": 9, "type": "reference"},
]

# Enhanced documentation sources with subject-specific resources
DOC_SOURCES = [
    ("wikipedia", "https://en.wikipedia.org/wiki/{query}", 6),
    ("wikibooks", "https://en.wikibooks.org/wiki/{query}", 7),
    ("stack_overflow", "https://stackoverflow.com/search?q={query}", 8),
    ("github", "https://github.com/search?q={query}", 7),
    ("medium", "https://medium.com/search?q={query}", 6),
    ("dev_to", "https://dev.to/search?q={query}", 7),
]

# Subject-specific resource pools
SUBJECT_RESOURCES = {
    "mathematics": [
        {"name": "Wolfram MathWorld", "url": "https://mathworld.wolfram.com", "quality": 9, "description": "Comprehensive mathematical encyclopedia"},
        {"name": "Paul's Online Math Notes", "url": "https://tutorial.math.lamar.edu", "quality": 8, "description": "Free calculus and algebra tutorials"},
        {"name": "3Blue1Brown", "url": "https://www.3blue1brown.com", "quality": 9, "description": "Visual mathematics explanations"},
        {"name": "Desmos Calculator", "url": "https://www.desmos.com/calculator", "quality": 8, "description": "Interactive graphing calculator"},
        {"name": "Khan Academy Math", "url": "https://www.khanacademy.org/math", "quality": 9, "description": "Free math courses from basic to advanced"},
        {"name": "Brilliant Math", "url": "https://brilliant.org/courses/mathematics/", "quality": 8, "description": "Interactive math problem solving"},
        {"name": "Mathway", "url": "https://www.mathway.com", "quality": 7, "description": "Step-by-step math problem solver"},
    ],
    "programming": [
        {"name": "LeetCode", "url": "https://leetcode.com", "quality": 9, "description": "Coding interview preparation platform"},
        {"name": "HackerRank", "url": "https://www.hackerrank.com", "quality": 8, "description": "Coding challenges and skill assessment"},
        {"name": "freeCodeCamp", "url": "https://www.freecodecamp.org", "quality": 9, "description": "Free coding bootcamp with certifications"},
        {"name": "Codecademy", "url": "https://www.codecademy.com", "quality": 8, "description": "Interactive coding lessons"},
        {"name": "Replit", "url": "https://replit.com", "quality": 7, "description": "Online IDE for coding practice"},
        {"name": "CodePen", "url": "https://codepen.io", "quality": 7, "description": "Front-end code playground"},
        {"name": "GitHub Learning Lab", "url": "https://lab.github.com", "quality": 8, "description": "Interactive GitHub learning courses"},
        {"name": "Exercism", "url": "https://exercism.org", "quality": 8, "description": "Mentored coding exercises in 50+ languages"},
    ],
    "science": [
        {"name": "Khan Academy Science", "url": "https://www.khanacademy.org/science", "quality": 9, "description": "Comprehensive science education"},
        {"name": "Crash Course", "url": "https://www.youtube.com/c/crashcourse", "quality": 9, "description": "Fast-paced science video series"},
        {"name": "SciShow", "url": "https://www.youtube.com/c/scishow", "quality": 8, "description": "Science news and explanations"},
        {"name": "National Geographic", "url": "https://www.nationalgeographic.com", "quality": 8, "description": "Science and nature documentaries"},
        {"name": "PhET Interactive Simulations", "url": "https://phet.colorado.edu", "quality": 9, "description": "Interactive physics and chemistry simulations"},
        {"name": "BioInteractive", "url": "https://www.biointeractive.org", "quality": 8, "description": "Biology teaching resources from HHMI"},
        {"name": "NASA Education", "url": "https://www.nasa.gov/audience/foreducators", "quality": 8, "description": "Space science and STEM resources"},
    ],
    "language": [
        {"name": "Duolingo", "url": "https://www.duolingo.com", "quality": 9, "description": "Gamified language learning platform"},
        {"name": "Memrise", "url": "https://www.memrise.com", "quality": 8, "description": "Spaced repetition language learning"},
        {"name": "BBC Languages", "url": "https://www.bbc.co.uk/languages", "quality": 7, "description": "Free language learning courses"},
        {"name": "SparkNotes Literature", "url": "https://www.sparknotes.com/lit", "quality": 7, "description": "Literature study guides and analysis"},
        {"name": "Grammar Girl", "url": "https://www.quickanddirtytips.com/grammar-girl", "quality": 7, "description": "Grammar and writing tips podcast"},
        {"name": "Purdue OWL", "url": "https://owl.purdue.edu", "quality": 8, "description": "Online writing lab and grammar resources"},
        {"name": "Merriam-Webster", "url": "https://www.merriam-webster.com", "quality": 8, "description": "Dictionary and thesaurus with word games"},
    ],
    "business": [
        {"name": "Khan Academy Business", "url": "https://www.khanacademy.org/economics-finance-domain", "quality": 8, "description": "Business and economics education"},
        {"name": "Coursera Business", "url": "https://www.coursera.org/browse/business", "quality": 8, "description": "Business courses from top universities"},
        {"name": "edX Business", "url": "https://www.edx.org/learn/business", "quality": 8, "description": "Business and management courses"},
        {"name": "Investopedia", "url": "https://www.investopedia.com", "quality": 8, "description": "Financial education and market analysis"},
    ],
    "history": [
        {"name": "Khan Academy History", "url": "https://www.khanacademy.org/humanities", "quality": 8, "description": "World history and humanities"},
        {"name": "Crash Course History", "url": "https://www.youtube.com/playlist?list=PL8dPuuaLjXtNjasccl-WajpONGX3zoY4", "quality": 8, "description": "World history video series"},
        {"name": "BBC History", "url": "https://www.bbc.co.uk/history", "quality": 7, "description": "Historical documentaries and articles"},
    ],
    "art": [
        {"name": "Khan Academy Art", "url": "https://www.khanacademy.org/humanities/art-history", "quality": 8, "description": "Art history and appreciation"},
        {"name": "The Metropolitan Museum of Art", "url": "https://www.metmuseum.org/learn", "quality": 8, "description": "Art education resources"},
        {"name": "Smarthistory", "url": "https://smarthistory.org", "quality": 8, "description": "Art history teaching resources"},
    ]
}

HEADERS = {"User-Agent": "XENIA-EduBot/1.0 (+https://example.com)"}


def _safe_get_json(url: str, params: Dict[str, Any] | None = None, timeout: float = 10.0) -> Dict[str, Any] | None:
    try:
        with httpx.Client(timeout=timeout, headers=HEADERS, follow_redirects=True) as client:
            r = client.get(url, params=params)
            if r.status_code == 200:
                try:
                    return r.json()
                except Exception:
                    return None
    except Exception:
        return None
    return None


def _youtube_search(query: str, max_results: int = 5, learning_style: str = None, difficulty: str = None) -> List[Dict[str, Any]]:
    """Enhanced YouTube search with learning style optimization and quality filtering."""
    if not YOUTUBE_API_KEY:
        # Fallback: use ytsearch via no API key not allowed; return empty list to avoid scraping policies
        return []
    
    # Enhanced query construction based on learning style and difficulty
    enhanced_query = query
    if learning_style:
        if learning_style.lower() in ["visual", "kinesthetic"]:
            enhanced_query = f"{query} tutorial demonstration visual"
        elif learning_style.lower() == "auditory":
            enhanced_query = f"{query} lecture explanation podcast"
        elif learning_style.lower() == "reading":
            enhanced_query = f"{query} step by step guide walkthrough"
    
    # Add difficulty-specific terms
    if difficulty:
        if difficulty.lower() == "beginner":
            enhanced_query += " beginner basics introduction"
        elif difficulty.lower() == "intermediate":
            enhanced_query += " intermediate practical examples"
        elif difficulty.lower() == "advanced":
            enhanced_query += " advanced masterclass expert"
    
    params = {
        "part": "snippet",
        "q": enhanced_query,
        "type": "video",
        "maxResults": str(max_results),
        "key": YOUTUBE_API_KEY,
        "fields": YOUTUBE_VIDEO_FIELDS,
        "safeSearch": "moderate",
        "order": "relevance",
        "videoDefinition": "any",
        "videoDuration": "medium"  # Prefer 4-20 minute videos
    }
    
    data = _safe_get_json(YOUTUBE_SEARCH_URL, params=params) or {}
    items = data.get("items", [])
    videos = []
    
    # Quality filtering keywords
    high_quality_channels = ["3blue1brown", "khan academy", "crash course", "freecodecamp", 
                           "mit opencourseware", "stanford", "harvard", "coursera"]
    
    for it in items:
        vid = it.get("id", {}).get("videoId")
        snippet = it.get("snippet", {})
        if not vid:
            continue
            
        channel_title = snippet.get("channelTitle", "").lower()
        video_title = snippet.get("title", "").lower()
        description = snippet.get("description", "").lower()
        
        # Calculate quality score
        quality_score = 5  # Base score
        
        # Boost score for high-quality channels
        if any(hq_channel in channel_title for hq_channel in high_quality_channels):
            quality_score += 3
            
        # Boost for educational keywords in title
        educational_keywords = ["tutorial", "explained", "guide", "course", "lecture", "learn"]
        quality_score += sum(2 for keyword in educational_keywords if keyword in video_title)
        
        # Boost for comprehensive content indicators
        if any(word in video_title for word in ["complete", "comprehensive", "full", "master"]):
            quality_score += 1
            
        videos.append({
            "source": "youtube",
            "title": snippet.get("title"),
            "url": f"https://www.youtube.com/watch?v={vid}",
            "quality_score": min(quality_score, 10),
            "metadata": {
                "channel": snippet.get("channelTitle"),
                "published_at": snippet.get("publishedAt"),
                "learning_style": learning_style,
                "difficulty": difficulty,
                "enhanced_query": enhanced_query,
                "description_snippet": snippet.get("description", "")[:200],
                "educational_indicators": [kw for kw in educational_keywords if kw in video_title]
            },
        })
    
    # Sort by quality score
    videos.sort(key=lambda x: x["quality_score"], reverse=True)
    return videos


def _ocw_links(query: str) -> List[Dict[str, Any]]:
    """Enhanced OpenCourseWare links with quality scoring."""
    q = urllib.parse.quote(query)
    resources: List[Dict[str, Any]] = []
    for entry in OPENCOURSEWARE_INDEX:
        url = entry["url"].format(query=q) if "{query}" in entry["url"] else entry["url"]
        resources.append({
            "source": "ocw",
            "title": entry["title"],
            "url": url,
            "quality_score": entry.get("quality", 7),
            "metadata": {
                "type": entry.get("type", "general"),
                "provider": entry["title"]
            },
        })
    
    # Sort by quality score
    resources.sort(key=lambda x: x["quality_score"], reverse=True)
    return resources[:4]


def _doc_links(query: str) -> List[Dict[str, Any]]:
    """Enhanced documentation links with source quality scoring."""
    q = urllib.parse.quote(query.replace(" ", "_"))
    results = []
    for name, tmpl, quality in DOC_SOURCES:
        results.append({
            "source": name,
            "title": f"{query} - {name.replace('_', ' ').title()}",
            "url": tmpl.format(query=q),
            "quality_score": quality,
            "metadata": {
                "source_type": "documentation",
                "search_query": query
            },
        })
    
    # Sort by quality score
    results.sort(key=lambda x: x["quality_score"], reverse=True)
    return results[:3]


def _get_subject_specific_resources(topic: str, subject_category: str) -> List[Dict[str, Any]]:
    """Get subject-specific high-quality resources."""
    resources = []
    
    if subject_category in SUBJECT_RESOURCES:
        for resource in SUBJECT_RESOURCES[subject_category]:
            resources.append({
                "source": "subject_specific",
                "title": f"{topic} - {resource['name']}",
                "url": resource["url"],
                "quality_score": resource["quality"],
                "metadata": {
                    "category": subject_category,
                    "provider": resource["name"],
                    "specialization": "subject_expert"
                }
            })
    
    return resources


def _get_huggingface_resources(topic: str, subject_category: str) -> List[Dict[str, Any]]:
    """Get relevant Hugging Face resources for educational topics."""
    resources = []
    
    # Map subject categories to Hugging Face resource types
    category_mapping = {
        "programming": ["models", "datasets"],
        "mathematics": ["models", "papers"],
        "science": ["models", "datasets", "papers"],
        "language": ["models", "datasets"],
        "general": ["models", "papers"]
    }
    
    relevant_types = category_mapping.get(subject_category, ["models", "papers"])
    
    for resource_type in relevant_types:
        if resource_type in HUGGINGFACE_RESOURCES:
            for resource in HUGGINGFACE_RESOURCES[resource_type]:
                # Check if resource is relevant to the topic
                if _is_resource_relevant_to_topic(resource, topic, subject_category):
                    resources.append({
                        "source": f"huggingface_{resource_type}",
                        "title": f"{topic} - {resource['name']} (Hugging Face)",
                        "url": resource["url"],
                        "quality_score": resource["quality"],
                        "metadata": {
                            "category": subject_category,
                            "provider": "Hugging Face",
                            "resource_type": resource_type,
                            "description": resource.get("description", ""),
                            "tags": resource.get("tags", []),
                            "specialization": "ai_research"
                        }
                    })
    
    return resources


def _is_resource_relevant_to_topic(resource: Dict[str, Any], topic: str, subject_category: str) -> bool:
    """Check if a Hugging Face resource is relevant to the given topic."""
    topic_lower = topic.lower()
    tags = resource.get("tags", [])
    description = resource.get("description", "").lower()
    
    # Check subject category relevance
    if subject_category == "programming":
        relevant_terms = ["code", "programming", "algorithm", "software", "development"]
    elif subject_category == "mathematics":
        relevant_terms = ["math", "mathematics", "calculus", "algebra", "statistics"]
    elif subject_category == "science":
        relevant_terms = ["science", "physics", "chemistry", "biology", "research"]
    elif subject_category == "language":
        relevant_terms = ["language", "literature", "writing", "grammar", "nlp"]
    else:
        relevant_terms = ["education", "learning", "teaching"]
    
    # Check if any relevant terms appear in topic, tags, or description
    for term in relevant_terms:
        if (term in topic_lower or 
            any(term in tag.lower() for tag in tags) or 
            term in description):
            return True
    
    return False


def _get_topic_specific_resources(topic: str, subject_category: str) -> List[Dict[str, Any]]:
    """Get highly specific resources for exact syllabus topics."""
    resources: List[Dict[str, Any]] = []
    topic_lower = topic.lower().strip()
    
    # Direct topic matching with fuzzy search
    topic_matches = []
    
    # Check for exact matches first
    if topic_lower in TOPIC_SPECIFIC_RESOURCES:
        topic_matches = TOPIC_SPECIFIC_RESOURCES[topic_lower]
    else:
        # Fuzzy matching for partial matches
        for topic_key, topic_resources in TOPIC_SPECIFIC_RESOURCES.items():
            # Check if the topic contains key terms or vice versa
            if (topic_key in topic_lower or 
                any(word in topic_lower for word in topic_key.split()) or
                any(word in topic_key for word in topic_lower.split())):
                topic_matches.extend(topic_resources)
                break  # Take first match to avoid duplicates
    
    # Convert to resource format
    for resource in topic_matches[:4]:  # Limit to top 4 most relevant
        resources.append({
            "source": "topic_specific",
            "title": resource["name"],
            "url": resource["url"],
            "quality_score": resource["quality"],
            "metadata": {
                "description": resource["description"],
                "subject_category": subject_category,
                "topic_match": topic,
                "relevance": "high",
                "type": "educational_content"
            },
        })
    
    return resources


def _generate_ai_resources_for_topic(topic: str, subject_category: str, difficulty_level: str = "intermediate") -> List[Dict[str, Any]]:
    """Generate AI-powered resource recommendations for topics not in our predefined lists."""
    try:
        from .ai_providers import get_ai_response
        
        prompt = f"""
Generate 3-4 highly relevant educational resources for the topic: "{topic}"
Subject category: {subject_category}
Difficulty level: {difficulty_level}

Focus on:
- High-quality, authoritative sources
- Current and up-to-date resources
- Mix of video, text, and interactive content
- Free or accessible resources when possible

Return ONLY valid JSON in this exact format:
{{
  "resources": [
    {{
      "name": "Resource Name",
      "url": "https://example.com",
      "description": "Brief description of the resource",
      "quality": 8,
      "type": "video|text|interactive|course"
    }}
  ]
}}
"""
        
        response = get_ai_response(prompt)
        # Clean up any markdown formatting
        clean_response = response.strip()
        if clean_response.startswith('```json'):
            clean_response = clean_response[7:]
        if clean_response.endswith('```'):
            clean_response = clean_response[:-3]
        
        parsed = json.loads(clean_response.strip())
        
        resources = []
        for resource in parsed.get("resources", []):
            resources.append({
                "source": "ai_generated",
                "title": resource["name"],
                "url": resource["url"],
                "quality_score": min(10, max(1, resource.get("quality", 7))),
                "metadata": {
                    "description": resource["description"],
                    "subject_category": subject_category,
                    "topic": topic,
                    "type": resource.get("type", "educational_content"),
                    "ai_generated": True,
                    "difficulty_level": difficulty_level
                },
            })
        
        return resources[:3]  # Limit to top 3 AI-generated resources
        
    except Exception as e:
        print(f"AI resource generation failed: {e}")
        return []


def fetch_resources_for_topic(topic: str, learning_style: str = None, topic_metadata: Dict[str, Any] = None, 
                            user_preferences: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Enhanced resource fetching with personalization and quality scoring."""
    resources: List[Dict[str, Any]] = []
    
    # Extract metadata for better resource targeting
    difficulty = topic_metadata.get("difficulty_score", 5) if topic_metadata else 5
    category = topic_metadata.get("category", "general") if topic_metadata else "general"
    
    # Map difficulty score to difficulty level
    if difficulty <= 3:
        difficulty_level = "beginner"
    elif difficulty <= 7:
        difficulty_level = "intermediate"
    else:
        difficulty_level = "advanced"
    
    # Use enhanced search based on topic metadata
    search_query = topic
    if topic_metadata:
        if category and category != "general":
            search_query = f"{category} {topic}"
    
    # Determine subject category for specialized resources
    subject_category = _determine_subject_category(topic, category)
    
    # 1. YouTube with enhanced targeting
    try:
        youtube_resources = _youtube_search(search_query, max_results=5, 
                                          learning_style=learning_style, 
                                          difficulty=difficulty_level)
        resources.extend(youtube_resources)
    except Exception:
        pass
    
    # 2. Topic-specific high-quality resources (most relevant first)
    try:
        topic_resources = _get_topic_specific_resources(topic, subject_category)
        if topic_resources:
            resources.extend(topic_resources)
        else:
            # Fallback to AI-generated resources for uncovered topics
            ai_resources = _generate_ai_resources_for_topic(topic, subject_category, difficulty_level)
            resources.extend(ai_resources)
    except Exception:
        pass
    
    # 3. Subject-specific high-quality resources
    try:
        subject_resources = _get_subject_specific_resources(topic, subject_category)
        resources.extend(subject_resources)
    except Exception:
        pass
    
    # 3. Hugging Face AI research resources
    try:
        hf_resources = _get_huggingface_resources(topic, subject_category)
        resources.extend(hf_resources)
    except Exception:
        pass
    
    # 4. OCW/MOOC catalogs
    try:
        ocw_resources = _ocw_links(search_query)
        resources.extend(ocw_resources)
    except Exception:
        pass
    
    # 4. Documentation and reference sources
    try:
        doc_resources = _doc_links(search_query)
        resources.extend(doc_resources)
    except Exception:
        pass
    
    # 5. Apply personalization filters
    if user_preferences:
        resources = _apply_personalization_filters(resources, user_preferences)
    
    # 6. Sort by quality score and diversify sources
    resources = _rank_and_diversify_resources(resources)
    
    # 7. Add recommendation metadata
    for resource in resources:
        resource["recommendation_score"] = _calculate_recommendation_score(
            resource, topic, learning_style, difficulty_level
        )
        resource["personalization_tags"] = _generate_personalization_tags(
            resource, learning_style, difficulty_level
        )
    
    return resources[:12]  # Return top 12 resources


def _determine_subject_category(topic: str, category: str) -> str:
    """Determine the broad subject category for specialized resource selection."""
    topic_lower = topic.lower()
    
    # Programming/CS terms
    if any(term in topic_lower for term in ["programming", "code", "algorithm", "data structure", "software", "web", "api", "javascript", "python", "java", "css", "html"]):
        return "programming"
    
    # Mathematics terms
    if any(term in topic_lower for term in ["math", "algebra", "calculus", "geometry", "statistics", "equation", "formula", "theorem", "proof"]):
        return "mathematics"
    
    # Science terms
    if any(term in topic_lower for term in ["physics", "chemistry", "biology", "science", "experiment", "theory", "hypothesis"]):
        return "science"
    
    # Language terms
    if any(term in topic_lower for term in ["english", "literature", "writing", "grammar", "language", "essay", "reading"]):
        return "language"
    
    # Use provided category as fallback
    return category if category in SUBJECT_RESOURCES else "general"


def _apply_personalization_filters(resources: List[Dict[str, Any]], 
                                 user_preferences: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Apply user preference filters to resources."""
    filtered_resources = []
    
    # Get user preferences
    preferred_sources = user_preferences.get("preferred_sources", [])
    avoid_sources = user_preferences.get("avoid_sources", [])
    min_quality = user_preferences.get("min_quality_score", 5)
    free_only = user_preferences.get("free_only", False)
    
    for resource in resources:
        # Skip if source should be avoided
        if resource["source"] in avoid_sources:
            continue
            
        # Skip if quality too low
        if resource.get("quality_score", 5) < min_quality:
            continue
            
        # Skip paid resources if free_only is True
        if free_only and resource.get("metadata", {}).get("free") is False:
            continue
            
        filtered_resources.append(resource)
    
    # Boost preferred sources
    if preferred_sources:
        for resource in filtered_resources:
            if resource["source"] in preferred_sources:
                resource["quality_score"] = resource.get("quality_score", 5) + 2
    
    return filtered_resources


def _rank_and_diversify_resources(resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Rank resources by quality and ensure source diversity."""
    # Sort by quality score first
    resources.sort(key=lambda x: x.get("quality_score", 5), reverse=True)
    
    # Diversify sources to avoid all resources from one source
    diversified = []
    source_counts = {}
    max_per_source = 3
    
    for resource in resources:
        source = resource["source"]
        current_count = source_counts.get(source, 0)
        
        if current_count < max_per_source:
            diversified.append(resource)
            source_counts[source] = current_count + 1
    
    return diversified


def _calculate_recommendation_score(resource: Dict[str, Any], topic: str, 
                                  learning_style: str, difficulty_level: str) -> float:
    """Calculate a comprehensive recommendation score for a resource."""
    base_score = resource.get("quality_score", 5)
    
    # Boost for learning style match
    if learning_style:
        metadata = resource.get("metadata", {})
        if metadata.get("learning_style") == learning_style:
            base_score += 1
    
    # Boost for difficulty match
    if difficulty_level:
        metadata = resource.get("metadata", {})
        if metadata.get("difficulty") == difficulty_level:
            base_score += 1
    
    # Boost for educational indicators
    educational_indicators = resource.get("metadata", {}).get("educational_indicators", [])
    base_score += len(educational_indicators) * 0.5
    
    # Boost for subject specialization
    if resource.get("metadata", {}).get("specialization") == "subject_expert":
        base_score += 2
    
    return min(base_score, 10)


def _generate_personalization_tags(resource: Dict[str, Any], learning_style: str, 
                                 difficulty_level: str) -> List[str]:
    """Generate tags explaining why this resource was recommended."""
    tags = []
    
    # Quality tags
    quality_score = resource.get("quality_score", 5)
    if quality_score >= 9:
        tags.append("high_quality")
    elif quality_score >= 7:
        tags.append("good_quality")
    
    # Learning style tags
    if learning_style:
        metadata = resource.get("metadata", {})
        if metadata.get("learning_style") == learning_style:
            tags.append(f"matches_{learning_style}_style")
    
    # Source type tags
    source = resource.get("source", "")
    if source == "youtube":
        tags.append("video_content")
    elif source == "subject_specific":
        tags.append("specialized_resource")
    elif source in ["wikipedia", "documentation"]:
        tags.append("reference_material")
    
    # Educational indicators
    educational_indicators = resource.get("metadata", {}).get("educational_indicators", [])
    if educational_indicators:
        tags.append("educational_content")
    
    return tags


def fetch_and_store_resources_for_topics(user_id: str, topics: List[str], max_per_topic: int = 6) -> None:
    sb = get_supabase()
    for t in topics:
        res_list = fetch_resources_for_topic(t)[:max_per_topic]
        rows = []
        for r in res_list:
            rows.append({
                "user_id": user_id,
                "topic": t,
                "source": r["source"],
                "title": r["title"],
                "url": r["url"],
                "metadata": json.dumps(r.get("metadata") or {}),
            })
        if rows:
            try:
                sb.table("resources").insert(rows).execute()
            except Exception as e:
                # Duplicate or constraint: ignore silently
                if 'duplicate' not in str(e).lower():
                    print(f"Resource insert failed for topic {t}: {e}")
        time.sleep(0.2)  # small throttle


def get_resources(user_id: str) -> List[Dict[str, Any]]:
    sb = get_supabase()
    try:
        resp = sb.table("resources").select("topic, source, title, url, metadata").eq("user_id", user_id).limit(500).execute()
        
        # Parse the metadata field from JSON string to dict
        for resource in resp.data:
            if isinstance(resource.get("metadata"), str):
                try:
                    resource["metadata"] = json.loads(resource["metadata"])
                except json.JSONDecodeError:
                    resource["metadata"] = {} # or some default value
                    
        return resp.data or []
    except Exception:
        return []
