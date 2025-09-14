import React, { useState, useEffect, useRef, useCallback } from 'react';

const GridLayout = () => {
  const [widgets, setWidgets] = useState([]);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [resizingWidget, setResizingWidget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const gridRef = useRef(null);
  const widgetIdCounter = useRef(0);

  // Grid configuration
  const GRID_SIZE = 20; // Grid snap size in pixels
  const MIN_WIDGET_SIZE = { width: 100, height: 60 };

  // Load widgets from localStorage on component mount
  useEffect(() => {
    console.log('Loading widgets from localStorage...');
    const savedWidgets = localStorage.getItem('gridWidgets');
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets);
        console.log('Loaded widgets:', parsedWidgets);
        setWidgets(parsedWidgets);
        // Update counter to avoid ID conflicts
        const maxId = parsedWidgets.reduce(
          (max, widget) => Math.max(max, widget.id),
          0
        );
        widgetIdCounter.current = maxId + 1;
      } catch (error) {
        console.error('Error loading widgets from localStorage:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save widgets to localStorage whenever widgets change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      console.log('Saving widgets to localStorage:', widgets);
      localStorage.setItem('gridWidgets', JSON.stringify(widgets));
    }
  }, [widgets, isLoaded]);

  // Snap position to grid
  const snapToGrid = useCallback((x, y) => {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
    };
  }, []);

  // Add new widget
  const addWidget = useCallback(() => {
    const newWidget = {
      id: widgetIdCounter.current++,
      x: 20,
      y: 20,
      width: 200,
      height: 120,
      title: `Widget ${widgetIdCounter.current - 1}`,
    };
    setWidgets((prev) => [...prev, newWidget]);
  }, []);

  // Update widget properties
  const updateWidget = useCallback((id, updates) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === id ? { ...widget, ...updates } : widget
      )
    );
  }, []);

  // Remove widget
  const removeWidget = useCallback((id) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== id));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={addWidget}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Add Widget
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('gridWidgets');
            setWidgets([]);
            widgetIdCounter.current = 0;
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginLeft: '10px',
          }}
        >
          Clear All
        </button>
        <button
          onClick={() => {
            const savedData = localStorage.getItem('gridWidgets');
            console.log('Current localStorage data:', savedData);
            alert(
              `Widgets in storage: ${
                savedData ? JSON.parse(savedData).length : 0
              }`
            );
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginLeft: '10px',
          }}
        >
          Debug Storage
        </button>
        <span style={{ marginLeft: '20px', color: '#666' }}>
          Widgets: {widgets.length} | Drag to move, resize from corners
        </span>
      </div>

      <div
        ref={gridRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '600px',
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
          backgroundImage: `
            linear-gradient(to right, #e0e0e0 1px, transparent 1px),
            linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          overflow: 'hidden',
        }}
      >
        {widgets.map((widget) => (
          <Widget
            key={widget.id}
            widget={widget}
            onUpdate={updateWidget}
            onRemove={removeWidget}
            draggedWidget={draggedWidget}
            setDraggedWidget={setDraggedWidget}
            resizingWidget={resizingWidget}
            setResizingWidget={setResizingWidget}
            dragOffset={dragOffset}
            setDragOffset={setDragOffset}
            snapToGrid={snapToGrid}
            gridRef={gridRef}
            minSize={MIN_WIDGET_SIZE}
          />
        ))}
      </div>
    </div>
  );
};

// Widget component with drag and resize functionality
const Widget = ({
  widget,
  onUpdate,
  onRemove,
  draggedWidget,
  setDraggedWidget,
  resizingWidget,
  setResizingWidget,
  dragOffset,
  setDragOffset,
  snapToGrid,
  gridRef,
  minSize,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startResize, setStartResize] = useState(null);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.classList.contains('resize-handle')) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = gridRef.current.getBoundingClientRect();
      const offset = {
        x: e.clientX - rect.left - widget.x,
        y: e.clientY - rect.top - widget.y,
      };

      setDraggedWidget(widget.id);
      setDragOffset(offset);
      setIsDragging(true);
    },
    [widget, gridRef, setDraggedWidget, setDragOffset]
  );

  // Handle mouse down for resizing
  const handleResizeMouseDown = useCallback(
    (e, handle) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = gridRef.current.getBoundingClientRect();
      setResizingWidget(widget.id);
      setResizeHandle(handle);
      setStartResize({
        mouseX: e.clientX - rect.left,
        mouseY: e.clientY - rect.top,
        startX: widget.x,
        startY: widget.y,
        startWidth: widget.width,
        startHeight: widget.height,
      });
      setIsResizing(true);
    },
    [widget, gridRef, setResizingWidget]
  );

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!gridRef.current) return;

      const rect = gridRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Handle dragging
      if (isDragging && draggedWidget === widget.id) {
        const newX = mouseX - dragOffset.x;
        const newY = mouseY - dragOffset.y;
        const snapped = snapToGrid(Math.max(0, newX), Math.max(0, newY));

        // Keep widget within grid bounds
        const maxX = rect.width - widget.width;
        const maxY = rect.height - widget.height;

        onUpdate(widget.id, {
          x: Math.min(maxX, Math.max(0, snapped.x)),
          y: Math.min(maxY, Math.max(0, snapped.y)),
        });
      }

      if (isResizing && resizingWidget === widget.id && startResize) {
        const deltaX = mouseX - startResize.mouseX;
        const deltaY = mouseY - startResize.mouseY;

        let newX = startResize.startX;
        let newY = startResize.startY;
        let newWidth = startResize.startWidth;
        let newHeight = startResize.startHeight;

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(minSize.width, startResize.startWidth + deltaX);
            newHeight = Math.max(
              minSize.height,
              startResize.startHeight + deltaY
            );
            break;
          case 'sw':
            newWidth = Math.max(minSize.width, startResize.startWidth - deltaX);
            newHeight = Math.max(
              minSize.height,
              startResize.startHeight + deltaY
            );
            newX = startResize.startX + (startResize.startWidth - newWidth);
            break;
          case 'ne':
            newWidth = Math.max(minSize.width, startResize.startWidth + deltaX);
            newHeight = Math.max(
              minSize.height,
              startResize.startHeight - deltaY
            );
            newY = startResize.startY + (startResize.startHeight - newHeight);
            break;
          case 'nw':
            newWidth = Math.max(minSize.width, startResize.startWidth - deltaX);
            newHeight = Math.max(
              minSize.height,
              startResize.startHeight - deltaY
            );
            newX = startResize.startX + (startResize.startWidth - newWidth);
            newY = startResize.startY + (startResize.startHeight - newHeight);
            break;
        }

        // Keep within grid bounds
        const maxWidth = rect.width - newX;
        const maxHeight = rect.height - newY;
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        const snapped = snapToGrid(newX, newY);
        const snappedSize = snapToGrid(newWidth, newHeight);

        onUpdate(widget.id, {
          x: Math.max(0, snapped.x),
          y: Math.max(0, snapped.y),
          width: Math.max(minSize.width, snappedSize.x),
          height: Math.max(minSize.height, snappedSize.y),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setDraggedWidget(null);
      setResizingWidget(null);
      setResizeHandle(null);
      setStartResize(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [
    isDragging,
    isResizing,
    draggedWidget,
    resizingWidget,
    widget.id,
    dragOffset,
    startResize,
    resizeHandle,
    snapToGrid,
    onUpdate,
    minSize,
  ]);

  const widgetStyle = {
    position: 'absolute',
    left: `${widget.x}px`,
    top: `${widget.y}px`,
    width: `${widget.width}px`,
    height: `${widget.height}px`,
    backgroundColor: 'white',
    border: '2px solid #007bff',
    borderRadius: '8px',
    cursor: isDragging ? 'grabbing' : 'grab',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    zIndex: draggedWidget === widget.id ? 1000 : 1,
  };

  const headerStyle = {
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '6px 6px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  };

  const contentStyle = {
    flex: 1,
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: '12px',
  };

  const resizeHandleStyle = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#007bff',
    border: '1px solid white',
    borderRadius: '2px',
  };

  return (
    <div style={widgetStyle} onMouseDown={handleMouseDown}>
      <div style={headerStyle}>
        <span>{widget.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(widget.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
          }}
          title='Remove widget'
        >
          ×
        </button>
      </div>

      <div style={contentStyle}>
        Widget Content
        <br />
        <small>
          ({widget.width} × {widget.height})
        </small>
      </div>

      {/* Resize handles */}
      <div
        className='resize-handle'
        style={{
          ...resizeHandleStyle,
          bottom: '-6px',
          right: '-6px',
          cursor: 'nw-resize',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />
      <div
        className='resize-handle'
        style={{
          ...resizeHandleStyle,
          bottom: '-6px',
          left: '-6px',
          cursor: 'ne-resize',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
      />
      <div
        className='resize-handle'
        style={{
          ...resizeHandleStyle,
          top: '-6px',
          right: '-6px',
          cursor: 'ne-resize',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
      />
      <div
        className='resize-handle'
        style={{
          ...resizeHandleStyle,
          top: '-6px',
          left: '-6px',
          cursor: 'nw-resize',
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
      />
    </div>
  );
};

export default GridLayout;
