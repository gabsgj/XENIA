"""
File validation utilities without external dependencies.
Provides secure file validation using built-in Python libraries and filetype detection.
"""
import os
import logging
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
import mimetypes
import hashlib

logger = logging.getLogger('xenia')

# Allowed file types and their signatures
ALLOWED_FILE_TYPES = {
    # Documents
    'pdf': {
        'extensions': ['.pdf'],
        'mime_types': ['application/pdf'],
        'signatures': [b'%PDF'],
        'max_size_mb': 50
    },
    'doc': {
        'extensions': ['.doc'],
        'mime_types': ['application/msword'],
        'signatures': [b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'],  # OLE header
        'max_size_mb': 25
    },
    'docx': {
        'extensions': ['.docx'],
        'mime_types': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'signatures': [b'PK\x03\x04'],  # ZIP header (DOCX is ZIP-based)
        'max_size_mb': 25
    },
    'txt': {
        'extensions': ['.txt'],
        'mime_types': ['text/plain'],
        'signatures': [],  # Text files don't have specific signatures
        'max_size_mb': 10
    },
    # Images
    'png': {
        'extensions': ['.png'],
        'mime_types': ['image/png'],
        'signatures': [b'\x89PNG\r\n\x1a\n'],
        'max_size_mb': 10
    },
    'jpg': {
        'extensions': ['.jpg', '.jpeg'],
        'mime_types': ['image/jpeg'],
        'signatures': [b'\xff\xd8\xff'],
        'max_size_mb': 10
    },
    'jpeg': {
        'extensions': ['.jpg', '.jpeg'],
        'mime_types': ['image/jpeg'],
        'signatures': [b'\xff\xd8\xff'],
        'max_size_mb': 10
    }
}

class FileValidationError(Exception):
    """Raised when file validation fails."""
    def __init__(self, message: str, error_code: str = "FILE_VALIDATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)

class FileValidator:
    """Secure file validator without external dependencies."""
    
    def __init__(self, max_file_size_mb: int = 50):
        self.max_file_size_mb = max_file_size_mb
        self.allowed_types = ALLOWED_FILE_TYPES
    
    def validate_file(self, file_path: str, file_content: bytes = None) -> Dict[str, Any]:
        """
        Comprehensive file validation.
        
        Args:
            file_path: Path to the file or filename
            file_content: File content bytes (optional, will read from path if not provided)
            
        Returns:
            Dict with validation results
            
        Raises:
            FileValidationError: If validation fails
        """
        path = Path(file_path)
        filename = path.name
        extension = path.suffix.lower()
        
        # Read file content if not provided
        if file_content is None:
            if not path.exists():
                raise FileValidationError(f"File not found: {file_path}", "FILE_NOT_FOUND")
            
            try:
                with open(path, 'rb') as f:
                    file_content = f.read()
            except Exception as e:
                raise FileValidationError(f"Cannot read file: {e}", "FILE_READ_ERROR")
        
        # Basic validations
        self._validate_filename(filename)
        self._validate_file_size(file_content)
        self._validate_extension(extension)
        
        # Detect file type
        detected_type = self._detect_file_type(extension, file_content)
        
        # Validate against detected type
        self._validate_file_signature(detected_type, file_content)
        
        # Additional security checks
        self._security_checks(file_content)
        
        return {
            "valid": True,
            "filename": filename,
            "extension": extension,
            "detected_type": detected_type,
            "file_size": len(file_content),
            "mime_type": self.allowed_types[detected_type]['mime_types'][0],
            "hash_sha256": hashlib.sha256(file_content).hexdigest()
        }
    
    def _validate_filename(self, filename: str):
        """Validate filename for security issues."""
        if not filename or filename.strip() == "":
            raise FileValidationError("Empty filename", "INVALID_FILENAME")
        
        # Check for path traversal attempts
        if '..' in filename or '/' in filename or '\\' in filename:
            raise FileValidationError("Invalid characters in filename", "INVALID_FILENAME")
        
        # Check filename length
        if len(filename) > 255:
            raise FileValidationError("Filename too long", "INVALID_FILENAME")
        
        # Check for dangerous filenames
        dangerous_names = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9']
        name_without_ext = Path(filename).stem.lower()
        if name_without_ext in dangerous_names:
            raise FileValidationError("Reserved filename", "INVALID_FILENAME")
    
    def _validate_file_size(self, file_content: bytes):
        """Validate file size."""
        size_mb = len(file_content) / (1024 * 1024)
        
        if size_mb > self.max_file_size_mb:
            raise FileValidationError(
                f"File too large: {size_mb:.1f}MB (max: {self.max_file_size_mb}MB)",
                "FILE_TOO_LARGE"
            )
        
        if len(file_content) == 0:
            raise FileValidationError("Empty file", "EMPTY_FILE")
    
    def _validate_extension(self, extension: str):
        """Validate file extension."""
        if not extension:
            raise FileValidationError("No file extension", "NO_EXTENSION")
        
        # Check if extension is allowed
        allowed_extensions = []
        for file_type, config in self.allowed_types.items():
            allowed_extensions.extend(config['extensions'])
        
        if extension not in allowed_extensions:
            raise FileValidationError(
                f"File type not allowed: {extension}. Allowed: {', '.join(allowed_extensions)}",
                "FILE_TYPE_NOT_ALLOWED"
            )
    
    def _detect_file_type(self, extension: str, file_content: bytes) -> str:
        """Detect file type based on extension and content."""
        # Find matching file type by extension
        for file_type, config in self.allowed_types.items():
            if extension in config['extensions']:
                return file_type
        
        raise FileValidationError(f"Unknown file type: {extension}", "UNKNOWN_FILE_TYPE")
    
    def _validate_file_signature(self, file_type: str, file_content: bytes):
        """Validate file signature (magic bytes)."""
        config = self.allowed_types.get(file_type)
        if not config:
            raise FileValidationError(f"Unknown file type: {file_type}", "UNKNOWN_FILE_TYPE")
        
        signatures = config.get('signatures', [])
        if not signatures:
            # No signature validation for this file type (e.g., text files)
            return
        
        # Check if file content starts with any of the valid signatures
        for signature in signatures:
            if file_content.startswith(signature):
                return
        
        raise FileValidationError(
            f"Invalid file signature for {file_type}. File may be corrupted or not a valid {file_type} file.",
            "INVALID_FILE_SIGNATURE"
        )
    
    def _security_checks(self, file_content: bytes):
        """Additional security checks."""
        # Check for embedded executables (basic check)
        dangerous_signatures = [
            b'MZ',  # DOS/Windows executable
            b'\x7fELF',  # Linux executable
            b'\xca\xfe\xba\xbe',  # Java class file
            b'#!/bin/',  # Shell script
            b'<script',  # JavaScript (case insensitive check needed)
        ]
        
        content_lower = file_content[:1024].lower()  # Check first 1KB
        
        for signature in dangerous_signatures:
            if signature.lower() in content_lower:
                logger.warning(f"Potentially dangerous content detected: {signature}")
                # Don't block, just log for now
        
        # Check for excessively long lines (potential buffer overflow attempts)
        try:
            # Only check text-like files
            text_content = file_content[:4096].decode('utf-8', errors='ignore')
            lines = text_content.split('\n')
            for line in lines:
                if len(line) > 10000:  # 10KB line limit
                    raise FileValidationError(
                        "File contains excessively long lines",
                        "SUSPICIOUS_CONTENT"
                    )
        except UnicodeDecodeError:
            # Binary file, skip text checks
            pass

def validate_uploaded_file(filename: str, file_content: bytes) -> Dict[str, Any]:
    """
    Convenience function to validate uploaded files.
    
    Args:
        filename: Original filename
        file_content: File content bytes
        
    Returns:
        Validation results dict
        
    Raises:
        FileValidationError: If validation fails
    """
    max_size_mb = int(os.getenv('MAX_FILE_SIZE_MB', '50'))
    validator = FileValidator(max_size_mb=max_size_mb)
    
    return validator.validate_file(filename, file_content)

def get_safe_filename(filename: str) -> str:
    """
    Generate a safe filename for storage.
    
    Args:
        filename: Original filename
        
    Returns:
        Safe filename for storage
    """
    path = Path(filename)
    name = path.stem
    extension = path.suffix.lower()
    
    # Remove dangerous characters
    safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
    
    # Limit length
    if len(safe_name) > 100:
        safe_name = safe_name[:100]
    
    # Add timestamp to ensure uniqueness
    import time
    timestamp = int(time.time())
    
    return f"{safe_name}_{timestamp}{extension}"
