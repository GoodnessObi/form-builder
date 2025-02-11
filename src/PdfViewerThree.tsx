import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import * as fabric from "fabric";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

interface FileChangeEvent extends React.ChangeEvent<HTMLInputElement> {
	target: HTMLInputElement & { files: FileList };
}

interface Field {
	type: keyof typeof fieldOptions;
	page: number;
	coordinates?: { x: number; y: number; width: number; height: number };
}

const fieldOptions = {
	1: "Textfield",
	2: "Textarea",
	3: "Select",
	4: "Check box (Multiple Selection)",
	5: "Date",
	6: "Email",
	7: "Toggle Switch",
};

const PdfViewerThree = () => {
	const [file, setFile] = useState<string | null>(null);
	const [numPages, setNumPages] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [showFieldOptions, setShowFieldOptions] = useState(false);
	const [formSchema, setFormSchema] = useState<Field[]>([]);
	const [newFieldType, setNewFieldType] = useState<string | null>(null);
	const { editor, onReady } = useFabricJSEditor();
	const [rect, setRect] = useState<fabric.Rect | null>(null); // Track the rectangle object
	const [fileName, setFileName] = useState("");

	useEffect(() => {
		if (!editor || !fabric || !file) {
			console.log("Editor, Fabric, or file not initialized");
			return;
		}

		if (file) {
			editor.canvas.renderAll();
		}
	}, [editor, file]);

	useEffect(() => {
		if (!editor?.canvas || !file) return;

		// Clear existing rectangles
		editor.canvas.getObjects().forEach((obj) => {
			if (obj instanceof fabric.Rect) {
				editor.canvas.remove(obj);
			}
		});

		// Render saved fields for the current page
		formSchema
			.filter((field) => field.page === currentPage)
			.forEach((field) => {
				if (field.coordinates) {
					const rect = new fabric.Rect({
						left: field.coordinates.x,
						top: field.coordinates.y,
						width: field.coordinates.width,
						height: field.coordinates.height,
						fill: "rgba(0, 255, 0, 0.3)", // Different color for saved fields
						stroke: "green",
						strokeWidth: 2,
						lockRotation: true,
						selectable: false, // Make saved fields non-selectable
						objectCaching: false,
					});
					editor.canvas.add(rect);
				}
			});

		editor.canvas.renderAll();
	}, [currentPage, formSchema, editor, file]);

	const onFileChange = (event: FileChangeEvent) => {
		const uploadedFile = event.target.files[0];
		if (uploadedFile) {
			// Clear the canvas
			if (editor?.canvas) {
				editor.canvas.clear();
			}

			// Reset the form schema
			setFormSchema([]);

			// Set the new file and reset other states
			setFile(URL.createObjectURL(uploadedFile));
			setCurrentPage(1);
			setFileName(uploadedFile.name);
		} else {
			// Clear the canvas
			if (editor?.canvas) {
				editor.canvas.clear();
			}

			// Reset all states
			setFile(null);
			setFileName("");
			setFormSchema([]);
			setShowFieldOptions(false);
			setNewFieldType("");
		}
	};

	const handleFieldSelect = (fieldType: string) => {
		setNewFieldType(fieldType);
		addRectToCanvas();
	};

	const addRectToCanvas = () => {
		if (!editor) return;

		const rect = new fabric.Rect({
			left: 50,
			top: 50,
			width: 100,
			height: 50,
			fill: "rgba(0, 0, 0, 0)",
			stroke: "red",
			strokeWidth: 2,
			lockRotation: true,
			selectable: true,
			objectCaching: false,
		});

		editor.canvas.add(rect);
		editor.canvas.renderAll();

		// Store the rectangle object in state
		setRect(rect);
	};

	const saveField = () => {
		if (!rect) {
			console.error("No rectangle found");
			return;
		}

		// Extract coordinates and dimensions from the rectangle
		const coordinates = {
			x: rect.left || 0,
			y: rect.top || 0,
			width: rect.getScaledWidth() || 0, // Use getScaledWidth() for actual width
			height: rect.getScaledHeight() || 0, // Use getScaledHeight() for actual height
		};

		// Save the field with coordinates
		setFormSchema((prev) => [
			...prev,
			{
				type: (newFieldType as unknown as keyof typeof fieldOptions) || null,
				page: currentPage,
				coordinates,
			},
		]);

		// Reset state
		setNewFieldType(null);
		setRect(null);
	};

	const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
	const goToNextPage = () =>
		setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));

	return (
		<div className="min-h-full w-full text-center p-16 pt-8">
			<div className="w-full my-4 min-h-[150px] bg-gray-100 rounded-md flex flex-col justify-center items-center relative border-2 border-dashed border-gray-300 hover:border-gray-400 transition cursor-pointer">
				<input
					id="fileInput"
					className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
					type="file"
					accept=".pdf"
					onChange={onFileChange}
				/>
				<label htmlFor="fileInput" className="text-gray-600 font-medium">
					{fileName ? fileName : "Click or Drag to Upload File"}
				</label>
			</div>

			<div className="w-full min-h-full grid grid-cols-2 gap-4 mt-8">
				<div className="shadow-sm min-h-[500px]">
					<div className="text-left">Timeline Steps</div>
					<div className="p-8">
						{!file && <p>Upload a file to start</p>}
						{formSchema.map((item, index) => (
							<div key={index} className="text-left mb-2">
								<p>
									<strong>Type:</strong> {fieldOptions[item.type]}
								</p>
								<p>
									<strong>Page:</strong> {item.page}
								</p>
								{item.coordinates && (
									<p>
										<strong>Coordinates:</strong>{" "}
										{`x: ${item.coordinates.x}, y: ${item.coordinates.y}, width: ${item.coordinates.width}, height: ${item.coordinates.height}`}
									</p>
								)}
								<hr className="my-2" />
							</div>
						))}
						{file && (
							<div className="flex flex-col justify-start">
								{showFieldOptions ? (
									<NewFieldOptions
										onSelect={handleFieldSelect}
										saveField={saveField}
									/>
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

				<div className="shadow-sm min-h-screen">
					{file && (
						<>
							<div className="relative w-full h-full ">
								<Document
									file={file}
									onLoadSuccess={({ numPages }) => setNumPages(numPages)}
								>
									<Page key={`page_${currentPage}`} pageNumber={currentPage} />
								</Document>
								<FabricJSCanvas className="canvas-sample" onReady={onReady} />
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
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default PdfViewerThree;

const NewFieldOptions = ({
	onSelect,
	saveField,
}: {
	onSelect: (fieldType: string) => void;
	saveField: () => void;
}) => {
	const selectRef = useRef<HTMLSelectElement>(null); // Ref to the select element

	const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		onSelect(event.target.value);
	};

	const handleSave = () => {
		saveField(); // Call the saveField function
		if (selectRef.current) {
			selectRef.current.value = ""; // Clear the select field
		}
	};

	return (
		<div className="flex flex-row justify-between items-end gap-4">
			<div className="w-1/2 text-left">
				<label htmlFor="field" className="block">
					Select Field Type
				</label>
				<select
					ref={selectRef} // Attach the ref
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
				<button className="" type="button" onClick={handleSave}>
					Save
				</button>

				<button type="button">Remove</button>
			</div>
		</div>
	);
};
