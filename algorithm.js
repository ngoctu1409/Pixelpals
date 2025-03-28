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
const CELL_SIZE = 5;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = "";
let currentColor = '#000000';
let startX, startY, endX, endY;
let prevMouseX, prevMouseY, snapshot;
let eraserSize = 10;

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
});

const selectTool = (tool) => {
    currentTool = tool;
    ctx.lineWidth = tool === "pen" ? 1 : 0.5;
};

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

