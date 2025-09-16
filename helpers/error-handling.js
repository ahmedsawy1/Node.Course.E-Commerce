export const handleRouteError = (error) => {
    console.error("Error Happen:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
}