import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function ImageCropper({ onImageCropped, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImageSrc(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const initializeCrop = () => {
    const image = imageRef.current
    const container = containerRef.current
    if (!image || !container) return

    const containerRect = container.getBoundingClientRect()
    const displayWidth = containerRect.width
    const displayHeight = containerRect.height
    
    setImageSize({ width: displayWidth, height: displayHeight })
    
    // Initialize crop in center with size based on smaller dimension
    const minDim = Math.min(displayWidth, displayHeight)
    const initialSize = minDim * 0.7
    
    setCrop({
      x: (displayWidth - initialSize) / 2,
      y: (displayHeight - initialSize) / 2,
      size: initialSize
    })
  }

  const handleMouseDown = (e, type) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (type === 'drag') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y })
    } else if (type === 'resize') {
      setIsResizing(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(imageSize.width - crop.size, e.clientX - dragStart.x))
      const newY = Math.max(0, Math.min(imageSize.height - crop.size, e.clientY - dragStart.y))
      setCrop(prev => ({ ...prev, x: newX, y: newY }))
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      const delta = Math.max(deltaX, deltaY)
      
      const newSize = Math.max(50, Math.min(
        crop.size + delta,
        imageSize.width - crop.x,
        imageSize.height - crop.y
      ))
      
      setCrop(prev => ({ ...prev, size: newSize }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    
    // Detect pinch gesture (ctrlKey is set for trackpad pinch on most browsers)
    if (e.ctrlKey) {
      // Pinch zoom
      const delta = -e.deltaY * 0.01
      const newZoom = Math.max(1, Math.min(3, zoom + delta))
      setZoom(newZoom)
    } else {
      // Regular scroll - also zoom but slower
      const delta = -e.deltaY * 0.005
      const newZoom = Math.max(1, Math.min(3, zoom + delta))
      setZoom(newZoom)
    }
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, crop, dragStart, imageSize])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [zoom])

  useEffect(() => {
    if (imageSrc) {
      updateCroppedPreview()
    }
  }, [crop, imageSrc, zoom])

  const updateCroppedPreview = () => {
    const image = imageRef.current
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!image || !canvas || !container) return

    const size = 400 // Output size
    canvas.width = size
    canvas.height = size
    
    const ctx = canvas.getContext('2d')
    
    // Get container dimensions
    const containerRect = container.getBoundingClientRect()
    
    // Calculate displayed dimensions with zoom (object-contain)
    const imgNaturalRatio = image.naturalWidth / image.naturalHeight
    const containerRatio = containerRect.width / containerRect.height
    
    let displayedWidth, displayedHeight, offsetX, offsetY
    
    if (imgNaturalRatio > containerRatio) {
      // Image is wider - fits to width
      displayedWidth = containerRect.width * zoom
      displayedHeight = displayedWidth / imgNaturalRatio
      offsetX = (containerRect.width - displayedWidth) / 2
      offsetY = (containerRect.height - displayedHeight) / 2
    } else {
      // Image is taller - fits to height
      displayedHeight = containerRect.height * zoom
      displayedWidth = displayedHeight * imgNaturalRatio
      offsetX = (containerRect.width - displayedWidth) / 2
      offsetY = (containerRect.height - displayedHeight) / 2
    }
    
    // Calculate scale factor between displayed and natural size
    const scale = image.naturalWidth / displayedWidth
    
    // Convert crop coordinates to natural image coordinates
    const sx = (crop.x - offsetX) * scale
    const sy = (crop.y - offsetY) * scale
    const sSize = crop.size * scale
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    // Create circular clipping path
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    
    // Draw cropped portion
    ctx.drawImage(image, sx, sy, sSize, sSize, 0, 0, size, size)
    
    // Store the data URL for preview
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCroppedImage(dataUrl)
  }

  const handleConfirm = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas not found')
      return
    }
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Blob created successfully:', blob.size, 'bytes')
        
        // Create a File object from blob with proper filename and extension
        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' })
        
        if (onImageCropped) {
          onImageCropped(file)
        }
      } else {
        console.error('Failed to create blob from canvas')
        alert('Failed to process image. Please try again.')
      }
    }, 'image/jpeg', 0.9)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-5xl w-full shadow-2xl border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <i className="fas fa-crop-alt text-white text-xl"></i>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white">
                  Crop Profile Photo
                </h3>
                <p className="text-slate-400 text-sm">Adjust and preview your profile picture</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-slate-700/50 hover:bg-red-500/20 border border-slate-600 hover:border-red-500 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
            >
              <i className="fas fa-times"></i>
            </motion.button>
          </div>
          
          {!imageSrc ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-dashed border-slate-600 rounded-2xl p-16 text-center bg-slate-800/50 hover:bg-slate-800/70 hover:border-blue-500 transition-all"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <i className="fas fa-cloud-upload-alt text-7xl text-blue-400 mb-6"></i>
              </motion.div>
              <p className="text-slate-300 text-lg mb-2 font-semibold">
                Upload Your Photo
              </p>
              <p className="text-slate-500 mb-6 text-sm">
                Drag and drop or click to browse
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold cursor-pointer inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                <i className="fas fa-image"></i>
                Choose Image
              </label>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center items-center gap-8">
                {/* Interactive Crop Area */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-sm text-slate-300 font-semibold">Adjust Crop Area</p>
                  </div>
                  <div 
                    ref={containerRef}
                    className="relative w-96 h-96 rounded-2xl overflow-hidden border-2 border-slate-600 bg-black shadow-2xl"
                    style={{ userSelect: 'none' }}
                  >
                    <img
                      ref={imageRef}
                      src={imageSrc}
                      alt="Original"
                      className="w-full h-full object-contain"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center'
                      }}
                      onLoad={initializeCrop}
                      draggable={false}
                    />
                    
                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                    
                    {/* Crop selection area */}
                    <motion.div
                      animate={{ 
                        boxShadow: isDragging || isResizing 
                          ? '0 0 0 9999px rgba(0, 0, 0, 0.7)' 
                          : '0 0 0 9999px rgba(0, 0, 0, 0.6)'
                      }}
                      className="absolute border-4 border-blue-500 rounded-full cursor-move shadow-2xl"
                      style={{
                        left: `${crop.x}px`,
                        top: `${crop.y}px`,
                        width: `${crop.size}px`,
                        height: `${crop.size}px`,
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'drag')}
                    >
                      {/* Grid lines for better alignment */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20"></div>
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20"></div>
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20"></div>
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20"></div>
                      </div>
                      
                      {/* Resize handle */}
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full cursor-se-resize border-4 border-white shadow-xl flex items-center justify-center"
                        style={{ transform: 'translate(50%, 50%)' }}
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                      >
                        <i className="fas fa-expand-alt text-white text-xs"></i>
                      </motion.div>
                    </motion.div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <i className="fas fa-hand-pointer text-blue-400 text-xs"></i>
                    <p className="text-xs text-slate-400">
                      Drag to move • Drag corner to resize • Scroll to zoom ({Math.round(zoom * 100)}%)
                    </p>
                  </div>
                </motion.div>
                
                {/* Arrow with animation */}
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <i className="fas fa-arrow-right text-4xl text-blue-400"></i>
                </motion.div>
                
                {/* Cropped Preview */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-sm text-slate-300 font-semibold">Preview</p>
                  </div>
                  {croppedImage ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 20 }}
                    >
                      <div className="w-72 h-72 rounded-full border-4 border-blue-500 shadow-2xl ring-4 ring-blue-500/20 overflow-hidden bg-white">
                        <img
                          src={croppedImage}
                          alt="Cropped"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-3 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg inline-flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-400"></i>
                        <span className="text-green-300 text-sm font-medium">Ready to use!</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-72 h-72 rounded-full border-4 border-slate-600 bg-slate-700/50 flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin text-4xl text-blue-400"></i>
                    </div>
                  )}
                </motion.div>
              </div>
              
              {/* Hidden canvas for processing */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Buttons */}
              <div className="flex gap-4 justify-center pt-6 border-t border-slate-700">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => {
                    setImageSrc(null)
                    setCroppedImage(null)
                  }}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 transition-all border border-slate-600"
                >
                  <i className="fas fa-sync-alt"></i>
                  Change Image
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl font-semibold shadow-lg flex items-center gap-2 transition-all border border-red-500/30"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleConfirm}
                  disabled={!croppedImage}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <i className="fas fa-check"></i>
                  Use This Photo
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

