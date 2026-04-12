import sys

class RequestLoggingMiddleware:
    """Log all incoming requests to stderr"""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the incoming request
        sys.stderr.write(f"\n{'='*80}\n")
        sys.stderr.write(f"🌐 INCOMING REQUEST: {request.method} {request.path}\n")
        sys.stderr.write(f"{'='*80}\n")
        sys.stderr.flush()
        
        response = self.get_response(request)
        return response
