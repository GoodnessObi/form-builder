// ts-ignore

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface FileChangeEvent extends React.ChangeEvent<HTMLInputElement> {
	target: HTMLInputElement & { files: FileList };
}

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

const fieldOptions = {
	1: "Input",
	2: "Textarea",
	3: "Select",
	4: "Checkbox",
};

const PdfViewerThree = () => {
	const [file, setFile] = useState<string | null>(null);
	const [numPages, setNumPages] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const pdfWrapperRef = useRef(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [showFieldOptions, setShowFieldOptions] = useState(false);
	const [formSchema, setFormSchema] = useState<Field[]>([]);
	const [newField, setNewField] = useState<Field>();

	const onFileChange = (event: FileChangeEvent) => {
		const uploadedFile = event.target.files[0];
		if (uploadedFile) {
			setFile(URL.createObjectURL(uploadedFile));
			setCurrentPage(1);
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

	const handleFieldSelect = (fieldType: string) => {};

	const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
	const goToNextPage = () =>
		setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));

	return (
		<div className="min-h-ful w-full text-center">
			<input type="file" accept=".pdf" onChange={onFileChange} />

			<div className="w-full min-h-full grid grid-cols-2 gap-4 mt-8">
				<div className="shadow-sm min-h-[500px]">
					<div className=" text-left">Timeline Steps</div>

					<div className="p-8">
						{!file && <p>Upload a file to start</p>}
						{file && (
							<div className="flex flex-col justify-start">
								{showFieldOptions ? (
									<NewFieldOptions onSelect={handleFieldSelect} />
								) : (
									<button
										className="p-8 w-fit"
										type="button"
										onClick={() => setShowFieldOptions(true)}
									>
										Add a form field
									</button>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="shadow-sm">
					<div>
						{file && (
							<div>
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
										<Page
											key={`page_${currentPage}`}
											pageNumber={currentPage}
										/>
									</Document>
									<canvas
										ref={canvasRef}
										// onMouseDown={handleMouseDown}
										// onMouseMove={handleMouseMove}
										// onMouseUp={handleMouseUp}
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											width: "100%",
											height: "100%",
											// cursor: startSelection ? "crosshair" : "default",
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
		</div>
	);
};

export default PdfViewerThree;

const NewFieldOptions = ({
	onSelect,
}: {
	onSelect: (fieldType: string) => void;
}) => {
	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		onSelect(event.target.value);
	};

	return (
		<div className="flex flex-row justify-between items-end gap-4">
			<div className="w-1/2 text-left">
				<label htmlFor="field" className="block">
					Select Field Type
				</label>
				<select
					className="w-full border border-black rounded-sm p-2"
					name="field"
					id="field"
					onChange={handleChange}
				>
					<option value="">Select Field Type</option>
					{Object.entries(fieldOptions).map(([key, value]) => (
						<option key={key} value={key}>
							{value}
						</option>
					))}
				</select>
			</div>

			<div className="w-1/2">
				<button className="" type="button">
					Save
				</button>

				<button type="button">Remove</button>
			</div>
		</div>
	);
};
