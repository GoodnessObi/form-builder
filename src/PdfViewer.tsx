// ts-ignore

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface Coordinates {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface Field {
	type: keyof typeof fieldOptions;
	coordinates: Coordinates;
	page: number;
}

interface FileChangeEvent extends React.ChangeEvent<HTMLInputElement> {
	target: HTMLInputElement & { files: FileList };
}

interface MouseEventWithCoords extends React.MouseEvent<HTMLCanvasElement> {
	clientX: number;
	clientY: number;
}

const fieldOptions = {
	1: "Input",
	2: "Textarea",
	3: "Select",
	4: "Checkbox",
};

const PdfViewer = () => {
	const [file, setFile] = useState<string | null>(null);
	const [numPages, setNumPages] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [annotations, setAnnotations] = useState<{
		[key: number]: { x: number; y: number; width: number; height: number }[];
	}>({});
	const [formSchema, setFormSchema] = useState<
		{
			type: keyof typeof fieldOptions;
			coordinates: { x: number; y: number; width: number; height: number };
			page: number;
		}[]
	>([]);
	const pdfWrapperRef = useRef(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
	const [endCoords, setEndCoords] = useState({ x: 0, y: 0 });
	const [showFieldOptions, setShowFieldOptions] = useState(false);
	const [selectedRect, setSelectedRect] = useState<Coordinates | null>(null);
	const [startSelection, setStartSelection] = useState(false);

	const onFileChange = (event: FileChangeEvent) => {
		const uploadedFile = event.target.files[0];
		if (uploadedFile) {
			setFile(URL.createObjectURL(uploadedFile));
			setCurrentPage(1);
			setAnnotations({});
			setFormSchema([]);
		}
	};

	const getCanvasCoordinates = (
		clientX: number,
		clientY: number
	): Coordinates => {
		if (!canvasRef.current) return { x: 0, y: 0, width: 0, height: 0 };

		const canvas = canvasRef.current;
		const rect = canvas.getBoundingClientRect();

		// Adjust for canvas scaling
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;

		const x = (clientX - rect.left) * scaleX;
		const y = (clientY - rect.top) * scaleY;

		return { x, y, width: 0, height: 0 };
	};

	const handleMouseDown = (event: MouseEventWithCoords) => {
		if (!canvasRef.current || !startSelection) return;

		const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);
		setIsDrawing(true);
		setStartCoords({ x, y });
		setEndCoords({ x, y });
	};

	const handleMouseMove = (event: MouseEventWithCoords) => {
		if (!isDrawing || !canvasRef.current || !startSelection) return;

		const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);
		setEndCoords({ x, y });
		drawCanvas();
	};

	const handleMouseUp = () => {
		if (!isDrawing || !startSelection) return;

		setIsDrawing(false);
		setShowFieldOptions(true);
		saveRectangle();
	};

	const drawCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas || !startSelection) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw existing annotations
		(annotations[currentPage] || []).forEach((rect) => {
			ctx.fillStyle = "rgba(18, 189, 18, 0.3)";
			ctx.strokeStyle = "black";
			ctx.lineWidth = 0.001;
			ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
			ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
		});

		// Draw the current rectangle being drawn
		if (isDrawing) {
			ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
			ctx.strokeStyle = "black";
			ctx.lineWidth = 0.01;
			const width = endCoords.x - startCoords.x;
			const height = endCoords.y - startCoords.y;
			ctx.fillRect(startCoords.x, startCoords.y, width, height);
			ctx.strokeRect(startCoords.x, startCoords.y, width, height);
		}
	};

	const saveRectangle = () => {
		const width = endCoords.x - startCoords.x;
		const height = endCoords.y - startCoords.y;

		if (width === 0 || height === 0) return;

		const newRect = {
			x: startCoords.x,
			y: startCoords.y,
			width,
			height,
		};

		setSelectedRect(newRect);
	};

	const handleFieldSelect = (fieldType: string) => {
		if (!selectedRect || !startSelection) return;

		const newField: Field = {
			type: fieldType as unknown as keyof typeof fieldOptions,
			coordinates: selectedRect,
			page: currentPage,
		};

		setFormSchema((prev) => [...prev, newField]);
		setAnnotations((prev) => ({
			...prev,
			[currentPage]: [...(prev[currentPage] || []), selectedRect],
		}));

		setShowFieldOptions(false);
		setSelectedRect(null);
		setStartSelection(false);
	};

	const undoLastSelection = () => {
		if (formSchema.length === 0) return;

		const lastField = formSchema[formSchema.length - 1] as {
			type: number;
			coordinates: { x: number; y: number; width: number; height: number };
			page: number;
		};
		const updatedFormSchema = formSchema.slice(0, -1);

		setFormSchema(updatedFormSchema);

		// Remove the last annotation from the canvas
		const updatedAnnotations = { ...annotations };
		updatedAnnotations[lastField.page] = updatedAnnotations[
			lastField.page
		].filter(
			(rect) =>
				rect.x !== lastField.coordinates.x ||
				rect.y !== lastField.coordinates.y ||
				rect.width !== lastField.coordinates.width ||
				rect.height !== lastField.coordinates.height
		);

		setAnnotations(updatedAnnotations);
	};

	useEffect(() => {
		drawCanvas();
	}, [annotations, currentPage]);

	const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
	const goToNextPage = () =>
		setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));

	return (
		<div
			style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
		>
			<div>
				{file ? (
					<>
						<p>
							<strong>Select Form Field on Pdf</strong>
						</p>
						<ul>
							{formSchema.map((field, index) => (
								<li
									key={index}
									style={{
										backgroundColor:
											field.page === currentPage ? "#f0f0f0" : "transparent",
										padding: "5px",
										margin: "2px 0",
										borderRadius: "4px",
									}}
								>
									{fieldOptions[field.type]} at (
									{Math.round(field.coordinates.x)},{" "}
									{Math.round(field.coordinates.y)}) - Width:{" "}
									{Math.round(field.coordinates.width)}, Height:{" "}
									{Math.round(field.coordinates.height)} (Page {field.page})
								</li>
							))}
						</ul>

						{showFieldOptions && (
							<NewFieldOptions onSelect={handleFieldSelect} />
						)}

						<button
							onClick={undoLastSelection}
							disabled={formSchema.length === 0}
						>
							Undo Last Selection
						</button>
					</>
				) : (
					<p>Upload File </p>
				)}
			</div>

			<div>
				<div>
					<input type="file" accept="application/pdf" onChange={onFileChange} />

					{file && (
						<div>
							<div style={{ display: "flex" }}>
								<p>Toolbar</p>
								<button onClick={() => setStartSelection(true)}>
									Start Selection
								</button>
							</div>
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
									onMouseDown={handleMouseDown}
									onMouseMove={handleMouseMove}
									onMouseUp={handleMouseUp}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										width: "100%",
										height: "100%",
										cursor: startSelection ? "crosshair" : "default",
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
									disabled={numPages !== null && currentPage >= numPages}
								>
									Next ➡️
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PdfViewer;

const NewFieldOptions = ({
	onSelect,
}: {
	onSelect: (fieldType: string) => void;
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		onSelect(event.target.value);
	};

	return (
		<div>
			<label htmlFor="field">Select Field Type</label>
			<select name="field" id="field" onChange={handleChange}>
				<option value="">Select Field Type</option>
				{Object.entries(fieldOptions).map(([key, value]) => (
					<option key={key} value={key}>
						{value}
					</option>
				))}
			</select>
		</div>
	);
};
