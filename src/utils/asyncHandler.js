const asyncHandler = (fn) => {
   return async (req, res, next) => {
     try {
        await fn(req, res, next)
     } catch (error) {
        console.error("Error in db:", error)
        
     }
    }
}
export {asyncHandler}