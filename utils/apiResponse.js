/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

export class ApiResponse {
  static success(data, message = "Success", meta = {}) {
    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message, errors = [], statusCode = 400) {
    return {
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
      statusCode,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(data, page, limit, total) {
    return {
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static created(data, message = "Resource created successfully") {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static noContent() {
    return {
      success: true,
      message: "No content",
      timestamp: new Date().toISOString(),
    };
  }
}

export default ApiResponse;

