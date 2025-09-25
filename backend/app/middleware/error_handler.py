from flask import jsonify
import logging
import traceback

logger = logging.getLogger('xenia')


def handle_database_error(error):
    """Handle common database/connection errors and return friendly JSON responses."""
    error_msg = str(error).lower()

    if 'connection reset by peer' in error_msg:
        return jsonify({
            'error': 'Service temporarily unavailable. Please try again.',
            'ok': False,
            'retry_after': 5
        }), 503

    if 'max outbound streams' in error_msg or 'too many open files' in error_msg:
        return jsonify({
            'error': 'Server is busy. Please try again in a moment.',
            'ok': False,
            'retry_after': 10
        }), 503

    if 'timeout' in error_msg or 'connect_timeout' in error_msg:
        return jsonify({
            'error': 'Request timed out. Please try again.',
            'ok': False
        }), 408

    # Default generic handler
    logger.error(f"Unhandled error: {error}")
    logger.error(traceback.format_exc())
    return jsonify({
        'error': 'Internal server error',
        'ok': False
    }), 500


def register_error_handlers(app):
    """Register generic exception handler to route through our DB-aware handler."""

    @app.errorhandler(Exception)
    def _handle_all_exceptions(error):
        # If it looks like a DB error, present friendlier message
        try:
            return handle_database_error(error)
        except Exception:
            logger.exception('Error while handling exception')
            return jsonify({'error': 'Internal server error', 'ok': False}), 500
