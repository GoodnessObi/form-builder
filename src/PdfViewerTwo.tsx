// import { useEffect, useRef, useState } from "react";
// import * as pdfjsLib from "pdfjs-dist";

// pdfjsLib.GlobalWorkerOptions.workerSrc =
// 	"//unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

// export default function PdfViewer({ pdfUrl }) {
// 	const canvasRef = useRef(null);
// 	const containerRef = useRef(null); // Ref for the parent container
// 	const [pageNumber, setPageNumber] = useState(1);
// 	const [totalPages, setTotalPages] = useState(0);
// 	const [scale, setScale] = useState(1); // Start with scale 1
// 	const [formFields, setFormFields] = useState([]); // State to store form fields
// 	const [canvasDimensions, setCanvasDimensions] = useState({
// 		width: 0,
// 		height: 0,
// 	}); // State to track canvas dimensions

// 	useEffect(() => {
// 		const loadPDF = async () => {
// 			if (!pdfUrl) return;
// 			const loadingTask = pdfjsLib.getDocument(pdfUrl);
// 			const pdf = await loadingTask.promise;
// 			setTotalPages(pdf.numPages);

// 			const page = await pdf.getPage(pageNumber);
// 			const viewport = page.getViewport({ scale });

// 			// Get the width of the parent container (excluding padding)
// 			const container = containerRef.current;
// 			const containerWidth =
// 				container.clientWidth -
// 				parseFloat(getComputedStyle(container).paddingLeft) -
// 				parseFloat(getComputedStyle(container).paddingRight);

// 			// Calculate the scale to fit the container width
// 			const newScale = containerWidth / viewport.width;
// 			const scaledViewport = page.getViewport({ scale: newScale });

// 			// Set canvas dimensions
// 			const canvas = canvasRef.current;
// 			canvas.height = scaledViewport.height;
// 			canvas.width = scaledViewport.width;

// 			// Update canvas dimensions in state
// 			setCanvasDimensions({ width: canvas.width, height: canvas.height });

// 			const renderContext = {
// 				canvasContext: canvas.getContext("2d"),
// 				viewport: scaledViewport,
// 			};
// 			await page.render(renderContext).promise;

// 			// Extract annotations
// 			const annotations = await page.getAnnotations();
// 			console.log("Annotations:", annotations);

// 			// Process form fields
// 			const fields = processFormFields(annotations, scaledViewport);
// 			setFormFields(fields); // Update state with form fields
// 		};

// 		loadPDF();
// 	}, [pdfUrl, pageNumber, scale]);

// 	// Function to process form fields from annotations
// 	const processFormFields = (annotations, viewport) => {
// 		return annotations
// 			.filter((annotation) => annotation.subtype === "Widget") // Filter only form fields
// 			.map((annotation) => {
// 				const rect = viewport.convertToViewportRectangle(annotation.rect);
// 				return {
// 					id: annotation.id, // Unique ID for the field
// 					type: "text", // Default type (you can customize based on annotation.fieldType)
// 					left: rect[0],
// 					top: rect[1],
// 					width: rect[2] - rect[0],
// 					height: rect[3] - rect[1],
// 				};
// 			});
// 	};

// 	const goToPreviousPage = () => {
// 		if (pageNumber > 1) {
// 			setPageNumber(pageNumber - 1);
// 		}
// 	};

// 	const goToNextPage = () => {
// 		if (pageNumber < totalPages) {
// 			setPageNumber(pageNumber + 1);
// 		}
// 	};

// 	const zoomIn = () => {
// 		setScale(scale + 0.25);
// 	};

// 	const zoomOut = () => {
// 		if (scale > 0.5) {
// 			setScale(scale - 0.25);
// 		}
// 	};

// 	const goToPage = (event) => {
// 		const page = parseInt(event.target.value, 10);
// 		if (page >= 1 && page <= totalPages) {
// 			setPageNumber(page);
// 		}
// 	};

// 	return (
// 		<div className="w-full h-full flex flex-col items-center border border-red">
// 			{/* Parent container for the canvas and overlay */}
// 			<div
// 				ref={containerRef}
// 				className="relative w-full"
// 				style={{ padding: "20px" }} // Example padding
// 			>
// 				{/* Canvas for rendering the PDF */}
// 				<canvas
// 					ref={canvasRef}
// 					style={{ width: "100%", height: "auto" }} // Make canvas responsive
// 				></canvas>

// 				{/* Overlay for form fields */}
// 				<div
// 					style={{
// 						position: "absolute",
// 						top: 0,
// 						left: 0,
// 						width: canvasDimensions.width,
// 						height: canvasDimensions.height,
// 						pointerEvents: "none", // Allow clicks to pass through to the canvas
// 					}}
// 				>
// 					{formFields.map((field) => (
// 						<input
// 							key={field.id}
// 							type={field.type}
// 							style={{
// 								border: "1px solid red",
// 								position: "absolute",
// 								left: field.left,
// 								top: field.top,
// 								width: field.width,
// 								height: field.height,
// 								pointerEvents: "auto",
// 							}}
// 							placeholder=""
// 						/>
// 					))}
// 				</div>
// 			</div>

// 			{/* Controls for navigation and zoom */}
// 			<div className="controls">
// 				<button onClick={goToPreviousPage} disabled={pageNumber <= 1}>
// 					Previous
// 				</button>
// 				<span>
// 					Page{" "}
// 					<input
// 						type="number"
// 						value={pageNumber}
// 						onChange={goToPage}
// 						min={1}
// 						max={totalPages}
// 					/>{" "}
// 					of {totalPages}
// 				</span>
// 				<button onClick={goToNextPage} disabled={pageNumber >= totalPages}>
// 					Next
// 				</button>
// 				<button onClick={zoomIn}>Zoom In</button>
// 				<button onClick={zoomOut}>Zoom Out</button>
// 			</div>
// 		</div>
// 	);
// }
