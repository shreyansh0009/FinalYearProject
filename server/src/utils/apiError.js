class apiError extends Error {

  constructor(
    statusCode,
    message = "Something went wrong!",
    errors = []
  ) {

    super(message)  // super used to overwrite the properties of a class
    this.statusCode = statusCode
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors

  }
}

export {apiError}
