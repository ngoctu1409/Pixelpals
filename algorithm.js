/* Dropdown menu của shape */

document.addEventListener("DOMContentLoaded", function () {
    const shapeButton = document.querySelector(".shape-list");
    const subShapeList = document.querySelector(".sub-shape-list");

    shapeButton.addEventListener("click", function (event) {
        event.stopPropagation();
        subShapeList.classList.toggle("active");
    });

    document.addEventListener("click", function (event) {
        if (!shapeButton.contains(event.target) && !subShapeList.contains(event.target)) {
            subShapeList.classList.remove("active");
        }
    });

    document.querySelectorAll(".draw-shape").forEach(item => {
        item.addEventListener("click", function (event) {
            event.preventDefault(); 
            subShapeList.classList.remove("active"); 
        });
    });
});

/* Khởi tạo canvas */
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let isFilling = false;
let currentTool = "";
let currentColor = '#000000';
let startX, startY, endX, endY;
let prevMouseX, prevMouseY, snapshot;
let eraserSize = 10;
let imageData; 
let offsetX, offsetY;
let canvasSnapshot;
let isSelectionMoved = false;


window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});


const selectTool = (tool) => {
    currentTool = tool;
    ctx.lineWidth = tool === "pen" ? 1 : 0.5;
    ctx.setLineDash([]);

    if (tool !== "selection") {
        canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        selection = null;
        isSelecting = false;
        isDragging = false;
    }
};

/* Selection tool */
const SELECTION_STYLE = {
    borderColor: "#00f",
    borderWidth: 1,
    borderDash: [5, 5],
    fillColor: "rgba(0, 0, 255, 0.1)"
};
const selectionOutline = document.querySelector('.selection-outline');


function startSelection(e) {
    if (currentTool !== "selection") return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selection && x >= selection.x && x <= selection.x + selection.width &&
        y >= selection.y && y <= selection.y + selection.height) {
        isDragging = true;
        offsetX = x - selection.x;
        offsetY = y - selection.y;
        return;
    }

    // Bắt đầu tạo vùng chọn mới
    isSelecting = true;
    startX = x;
    startY = y;
    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function updateSelection(e) {
    if (!isSelecting || currentTool !== "selection") return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.putImageData(canvasSnapshot, 0, 0);
    
    // Vẽ border nét đứt
    ctx.setLineDash(SELECTION_STYLE.borderDash);
    ctx.strokeStyle = SELECTION_STYLE.borderColor;
    ctx.lineWidth = SELECTION_STYLE.borderWidth;
    ctx.strokeRect(startX, startY, x - startX, y - startY);
    
    // Vẽ overlay màu
    ctx.fillStyle = SELECTION_STYLE.fillColor;
    ctx.fillRect(startX, startY, x - startX, y - startY);

    selectionOutline.style.display = 'block';
    selectionOutline.style.left = `${Math.min(startX, x)}px`;
    selectionOutline.style.top = `${Math.min(startY, y)}px`;
    selectionOutline.style.width = `${Math.abs(x - startX)}px`;
    selectionOutline.style.height = `${Math.abs(y - startY)}px`;
}

    
function finalizeSelection(e) {
    
    if (!isSelecting || currentTool !== "selection") return;

    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    selection = {
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        originalX: Math.min(startX, endX), 
        originalY: Math.min(startY, endY)  
    };

    if (selection.width > 0 && selection.height > 0) {
        imageData = ctx.getImageData(selection.x, selection.y, selection.width, selection.height);
        
        // KHÔNG clear vùng gốc
        ctx.putImageData(canvasSnapshot, 0, 0); 
        
        // Giữ outline hiển thị
        selectionOutline.style.display = 'block';
        selectionOutline.style.left = `${selection.x}px`;
        selectionOutline.style.top = `${selection.y}px`;
        selectionOutline.style.width = `${selection.width}px`;
        selectionOutline.style.height = `${selection.height}px`;
    }

    isSelecting = false;
}

function moveSelection(e) {
    if (!isDragging || !selection || !imageData) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Giới hạn di chuyển trong canvas
    const newX = Math.max(0, Math.min(x - offsetX, canvas.width - selection.width));
    const newY = Math.max(0, Math.min(y - offsetY, canvas.height - selection.height));

    // Cập nhật vị trí
    selection.x = newX;
    selection.y = newY;

    // Khôi phục trạng thái gốc và vẽ cả 2 vùng
    ctx.putImageData(canvasSnapshot, 0, 0);
    
    // Vẽ hình gốc mờ
    ctx.globalAlpha = 0.3;
    ctx.putImageData(imageData, selection.originalX, selection.originalY);
    
    // Vẽ hình mới
    ctx.globalAlpha = 1;
    ctx.putImageData(imageData, newX, newY);

    // Cập nhật outline
    selectionOutline.style.left = `${newX}px`;
    selectionOutline.style.top = `${newY}px`;

    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function updateSelectionData() {
    if (selection && imageData) {
        ctx.putImageData(canvasSnapshot, 0, 0);
        ctx.putImageData(imageData, selection.x, selection.y);
        canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
} 

function stopDragging() {
    if (!isDragging || !selection) return;

    // Xóa vùng gốc
    ctx.clearRect(
        selection.originalX,
        selection.originalY,
        selection.width,
        selection.height
    );
    
    // Vẽ vĩnh viễn ở vị trí mới
    ctx.putImageData(imageData, selection.x, selection.y);
    
    // Cập nhật snapshot
    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Reset trạng thái
    isDragging = false;
    selectionOutline.style.display = 'none';
    selection = null;
    imageData = null;
}


canvas.addEventListener("mousedown", (e) => {
    if (currentTool === "selection") startSelection(e);
    else if (currentTool !== "selection") startDraw(e); // Giữ nguyên chức năng vẽ
});

canvas.addEventListener("mousemove", (e) => {
    if (currentTool === "selection") {
        if (isSelecting) updateSelection(e);
        if (isDragging) moveSelection(e);
    } else {
        drawing(e);
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (currentTool === "selection") {
        if (isSelecting) finalizeSelection(e);
        if (isDragging) stopDragging();
    } else {
        stopDraw(e);
    }

    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

/* Thuật toán Bresenham vẽ đường thẳng */
function drawLine(x1, y1, x2, y2) {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        ctx.fillStyle = currentColor;
        ctx.fillRect(x1, y1, 1, 1);
        if (x1 === x2 && y1 === y2) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x1 += sx; }
        if (e2 < dx) { err += dx; y1 += sy; }
    }
}
const drawingLine = (e) => {
    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.moveTo(startX, startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
}

/* Vẽ hình chữ nhật */
function drawRectangle(x1, y1, x2, y2) {
    ctx.lineWidth = 0.1;
    let left = Math.min(x1, x2);
    let right = Math.max(x1, x2);
    let top = Math.min(y1, y2);
    let bottom = Math.max(y1, y2);

    drawLine(left, top, right, top); 
    drawLine(left, bottom, right, bottom); 
    drawLine(left, top, left, bottom);
    drawLine(right, top, right, bottom); 
}
const drawingRectangle = (e) => {
    let left = Math.min(startX, e.offsetX);
    let top = Math.min(startY, e.offsetY);
    let width = Math.abs(e.offsetX - startX);
    let height = Math.abs(e.offsetY - startY);

    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.strokeRect(left, top, width, height);
    ctx.closePath();
}

/* Vẽ hình tròn */
function drawCircle(xc, yc, r) {
    let x = 0, y = r;
    let p = 3 - 2 * r;

    function plotCirclePoints(xc, yc, x, y) {
        ctx.fillStyle = currentColor;
        ctx.fillRect(xc + x, yc + y, 1, 1);
        ctx.fillRect(xc - x, yc + y, 1, 1);
        ctx.fillRect(xc + x, yc - y, 1, 1);
        ctx.fillRect(xc - x, yc - y, 1, 1);
        ctx.fillRect(xc + y, yc + x, 1, 1);
        ctx.fillRect(xc - y, yc + x, 1, 1);
        ctx.fillRect(xc + y, yc - x, 1, 1);
        ctx.fillRect(xc - y, yc - x, 1, 1);
    }

    while (x <= y) {
        plotCirclePoints(xc, yc, x, y);
        x++;

        if (p < 0) {
            p += 4 * x + 6;
        } else {
            y--;
            p += 4 * (x - y) + 10;
        }
    }
}
 const drawingCircle = (e) => {
    let radius = Math.sqrt((e.offsetX - prevMouseX) ** 2 + (e.offsetY - prevMouseY) ** 2);
    ctx.beginPath(); 
    ctx.strokeStyle = currentColor;
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    ctx.stroke(); 
    ctx.closePath();
 }

 /* Vẽ hình tam giác */
function drawTriangle(x1, y1, x2, y2, x3, y3) {
    drawLine(x1, y1, x2, y2);
    drawLine(x2, y2, x3, y3); 
    drawLine(x3, y3, x1, y1); 
}
const drawingTriangle = (e) => {
    let x1 = startX, y1 = startY;
    let x2 = e.offsetX, y2 = e.offsetY;
    let x3 = x1 - (x2 - x1), y3 = y2;

    ctx.beginPath();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = currentColor;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.stroke();
}

/* Điều chỉnh eraser */
const erasing = (e) => {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = eraserSize;
    ctx.lineCap = "round";
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over"; 
    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

document.addEventListener("DOMContentLoaded", function () {
    const eraserButton = document.getElementById("eraser");
    const eraserSlider = document.getElementById("eraser-size");
    const canvas = document.getElementById("canvas");

    // Lấy danh sách tất cả các công cụ (trừ eraser)
    const toolButtons = document.querySelectorAll(".tools-left button, .tools-top button, .tools-bottom button");

    let isEraserActive = false; 

    // Khi bấm vào Eraser
    eraserButton.addEventListener("click", function (event) {
        event.stopPropagation(); // Ngăn sự kiện lan ra ngoài

        // Nếu thanh trượt đang ẩn -> hiện, nếu đang hiện -> ẩn
        if (!isEraserActive) {
            eraserSlider.style.display = "block";
            isEraserActive = true;
            selectTool("eraser");
        } else {
            eraserSlider.style.display = "none";
            isEraserActive = false;
        }
    });

    // Khi chọn công cụ khác, ẩn thanh trượt eraser
    toolButtons.forEach(button => {
        if (button !== eraserButton) {
            button.addEventListener("click", function () {
                eraserSlider.style.display = "none";
                isEraserActive = false;
            });
        }
    });

    // Khi bắt đầu xóa, giữ trạng thái eraser đang hoạt động
    canvas.addEventListener("mousedown", function () {
        if (currentTool === "eraser") {
            isEraserActive = true;
        }
    });

    // Khi nhả chuột sau khi dùng eraser, giữ thanh trượt hiển thị
    canvas.addEventListener("mouseup", function () {
        if (currentTool === "eraser") {
            eraserSlider.style.display = "block";
        }
    });

    // Nếu nhấn ra ngoài (trừ eraser và thanh trượt), thì ẩn thanh trượt
    document.addEventListener("click", function (event) {
        if (!eraserButton.contains(event.target) && !eraserSlider.contains(event.target) && !canvas.contains(event.target)) {
            eraserSlider.style.display = "none";
            isEraserActive = false;
        }
    });
});

/* Chọn màu */
let colorPicker; 

function setup() {
    noCanvas(); 

    colorPicker = createColorPicker(currentColor);
    colorPicker.style('display', 'none'); 
    colorPicker.parent(document.body);

    colorPicker.elt.style.border = "none";
    colorPicker.elt.style.background = "none";
    colorPicker.elt.style.width = "0px";
    colorPicker.elt.style.height = "0px";
    colorPicker.elt.style.padding = "0";
    colorPicker.elt.style.overflow = "hidden";

    colorPicker.input(() => {
        currentColor = colorPicker.value();
        ctx.strokeStyle = currentColor; 
    });
}

/* Thuật toán flood fill để tô màu */
function floodFill(x, y, newColor) {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    let getPixelIndex = (x, y) => (y * canvas.width + x) * 4;

    let oldColor = data.slice(getPixelIndex(x, y), getPixelIndex(x, y) + 4);
    if (JSON.stringify(oldColor) === JSON.stringify(newColor)) return; 
    let queue = [[x, y]];
    let visited = new Set();
    let pixelsPerFrame = 100; 

    function processNextBatch() {
        let pixelsProcessed = 0;

        while (queue.length > 0 && pixelsProcessed < pixelsPerFrame) {
            let [cx, cy] = queue.shift();
            let index = getPixelIndex(cx, cy);
            
            if (cx < 0 || cy < 0 || cx >= canvas.width || cy >= canvas.height || visited.has(`${cx},${cy}`)) continue;

            let currentColor = data.slice(index, index + 4);
            if (JSON.stringify(currentColor) !== JSON.stringify(oldColor)) continue;

            
            data[index] = newColor[0]; // R
            data[index + 1] = newColor[1]; // G
            data[index + 2] = newColor[2]; // B
            data[index + 3] = 255; // Alpha

            visited.add(`${cx},${cy}`);
            pixelsProcessed++;

            // Thêm pixel lân cận vào hàng đợi
            queue.push([cx + 1, cy]);
            queue.push([cx - 1, cy]);
            queue.push([cx, cy + 1]);
            queue.push([cx, cy - 1]);
        }

        ctx.putImageData(imageData, 0, 0);

        if (queue.length > 0) {
            requestAnimationFrame(processNextBatch);
        }
    }

    requestAnimationFrame(processNextBatch);

        canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}


/* Bắt đầu vẽ */

const startDraw = (e) => {
        isDrawing = true;
        startX = e.offsetX;
        startY = e.offsetY;
        prevMouseX = e.offsetX;
        prevMouseY = e.offsetY;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/* Khi kéo chuột */
const drawing = (e) => {
    if (!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);

    if (currentTool === "pen") {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } else if (currentTool === "line") {
        drawingLine(e);
    } else if (currentTool === "rectangle") {
        drawingRectangle(e);
    } else if (currentTool === "circle") {
        drawingCircle(e);
    } else if (currentTool === "triangle") {
        drawingTriangle(e);
    } else if (currentTool === "eraser") {
        erasing(e);
    }
};

/* Dừng vẽ */
const stopDraw = (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    endX = e.offsetX;
    endY = e.offsetY;
    canvasSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (currentTool === "pen") {
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
    } else if (currentTool === "line") {
        drawLine(startX, startY, endX, endY);
    } else if (currentTool === "rectangle") {
        drawRectangle(startX, startY, endX, endY);
    } else if (currentTool === "circle") {
        let radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        drawCircle(startX, startY, Math.round(radius));
    } else if (currentTool === "triangle") {
        let x1 = startX, y1 = startY;
        let x2 = endX, y2 = endY;
        let x3 = x1 - (x2 - x1), y3 = y2;
        drawTriangle(x1, y1, x2, y2, x3, y3);
    } else if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = eraserSize;
        ctx.lineCap = "round";
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
        ctx.globalCompositeOperation = "source-over";
    }
};


canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("click", (e) => {
    if (currentTool === "bucket") {
        let newColor = [
            parseInt(currentColor.slice(1, 3), 16),
            parseInt(currentColor.slice(3, 5), 16),
            parseInt(currentColor.slice(5, 7), 16),
            255
        ];
        floodFill(e.offsetX, e.offsetY, newColor);
    }
});


document.getElementById("pen").addEventListener("click", () => {
    selectTool("pen");
});

document.getElementById("line").addEventListener("click", () => {
    selectTool("line");
});

document.getElementById("rectangle").addEventListener("click", (e) => {
    e.preventDefault();
    selectTool("rectangle");
});

document.getElementById("circle").addEventListener("click", (e) => {
    e.preventDefault();
    selectTool("circle");
});

document.getElementById("triangle").addEventListener("click", (e) => {
    e.preventDefault();
    selectTool("triangle");
});

document.getElementById("eraser-size").addEventListener("input", function () {
    eraserSize = this.value;
});

document.getElementById("eraser").addEventListener("click", function() {
    selectTool("eraser");
});

document.getElementById("pallete").addEventListener("click", () => {
    colorPicker.elt.style.display = "block"; 
    colorPicker.elt.click(); 
});

document.getElementById("bucket").addEventListener("click", () => {
    selectTool("bucket");
});

document.getElementById("clearCanvas").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("save").addEventListener("click", () => {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.fillStyle = "#FFFFFF"; 
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = tempCanvas.toDataURL("image/jpeg", 1.0);
    link.click();
});

document.getElementById("selection").addEventListener("click", () => {
    selectTool("selection");
});

// Thêm sự kiện ESC để hủy
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cancelSelection();
});
