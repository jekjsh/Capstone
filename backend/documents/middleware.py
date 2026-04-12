"""
Middleware to log all document uploads
"""
import logging

logger = logging.getLogger(__name__)

class DocumentUploadLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log POST requests to documents endpoint
        if request.method == 'POST' and'/api/documents/' in request.path:
            print("\n" + "=" * 80)
            print("📤 DOCUMENT UPLOAD REQUEST DETECTED")
            print("=" * 80)
            print(f"Method: {request.method}")
            print(f"Path: {request.path}")
            print(f"Content-Type: {request.content_type}")
            print("=" * 80 + "\n")
            logger.info(f"Document upload detected: {request.path}")

        response = self.get_response(request)
        
        # Log response
        if request.method == 'POST' and '/api/documents/' in request.path:
            print("\n" + "=" * 80)
            print(f"📤 DOCUMENT UPLOAD RESPONSE: {response.status_code}")
            print("=" * 80 + "\n")
            logger.info(f"Document upload response: {response.status_code}")

        return response
