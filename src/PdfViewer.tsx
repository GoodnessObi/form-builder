import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// import * as pdfjsLib from "pdfjs-dist";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
// import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

// pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// // const workerSrc = require("pdfjs-dist/build/pdf.worker");
// // pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// pdfjs.GlobalWorkerOptions.workerSrc =
// 	"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.js";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

const PdfViewer = () => {
	const [file, setFile] = useState(null);
	const [numPages, setNumPages] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [annotations, setAnnotations] = useState({});
	const pdfWrapperRef = useRef(null);
	const canvasRef = useRef(null);
	const [formSchema, setFormSchema] = useState<
		{ type: string; x: string; y: string }[]
	>([]);

	const onFileChange = (event) => {
		const uploadedFile = event.target.files[0];
		if (uploadedFile) {
			setFile(URL.createObjectURL(uploadedFile));
			setCurrentPage(1); // Reset à la première page
			setAnnotations({}); // Reset annotations
		}
	};

	const handlePdfClick = (event) => {
		if (!pdfWrapperRef.current) return;

		const rect = pdfWrapperRef.current.getBoundingClientRect();

		console.log(rect, event.clientX);
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		setAnnotations((prev) => ({
			...prev,
			[currentPage]: [...(prev[currentPage] || []), { x, y }],
		}));
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !pdfWrapperRef.current) return;

		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		(annotations[currentPage] || []).forEach(({ x, y }) => {
			ctx.beginPath();
			ctx.arc(x, y, 5, 0, 2 * Math.PI);
			ctx.fillStyle = "red";
			ctx.fill();
		});
	}, [annotations, currentPage]);

	const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
	const goToNextPage = () =>
		setCurrentPage((prev) => Math.min(prev + 1, numPages));

	return (
		<div
			style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
		>
			<div>
				{file ? (
					<>
						<p>
							{" "}
							<strong>Select Form Field on Pdf</strong>
						</p>
						<ul>
							{(annotations[currentPage] || []).map((point, index) => (
								<li key={index}>
									({Math.round(point.x)}, {Math.round(point.y)})
								</li>
							))}
						</ul>
					</>
				) : (
					<p>Upload File </p>
				)}
			</div>

			{/* Affichage du PDF avec navigation */}
			<div>
				<div>
					<input type="file" accept="application/pdf" onChange={onFileChange} />

					{file && (
						<>
							<div
								style={{
									position: "relative",
									display: "inline-block",
									textAlign: "center",
								}}
								ref={pdfWrapperRef}
							>
								<Document
									file={file}
									onLoadSuccess={({ numPages }) => setNumPages(numPages)}
								>
									<Page key={`page_${currentPage}`} pageNumber={currentPage} />
								</Document>
								<canvas
									ref={canvasRef}
									onClick={handlePdfClick}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										height: "100%",
										cursor: "crosshair",
										zIndex: 1000,
									}}
								/>
							</div>

							<div style={{ marginTop: "10px" }}>
								<button onClick={goToPrevPage} disabled={currentPage <= 1}>
									⬅️ Previous
								</button>
								<span style={{ margin: "0 10px" }}>
									Page {currentPage} / {numPages || "?"}
								</span>
								<button
									onClick={goToNextPage}
									disabled={currentPage >= numPages}
								>
									Next ➡️
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default PdfViewer;

const NewFieldOptions = () => {
	return (
		<div>
			<label htmlFor="field"></label>
			<select name="field" id="field">
				<option value="" selected>
					Select Field Type
				</option>
				<option value="1" selected>
					Input
				</option>
				<option value="2" selected>
					Select Dropdown
				</option>
				<option value="3" selected>
					Textarea
				</option>
			</select>
		</div>
	);
};
