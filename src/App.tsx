import { useState } from "react";
import "./App.css";
import PdfViewer from "./PdfViewer";
import PdfViewerTwo from "./PdfViewerTwo";
import FileAnnotations from "./FileAnnotations";
// import PdfViewer from "./PdfViewerTwo";

function App() {
	const [file, setFile] = useState<string | null>(null);

	const onFileChange = (event: any) => {
		const uploadedFile = event.target.files[0];
		if (uploadedFile) {
			setFile(URL.createObjectURL(uploadedFile));
		}
	};

	return (
		<div className="min-h-screen w-full flex flex-col gap-8 items-center py-10 px-8">
			<h1> Form Filler</h1>
			<PdfViewer />
			{/* 
			<div>
				<input type="file" accept="application/pdf" onChange={onFileChange} />
			</div>

			<div className="w-full grid grid-cols-2 gap-4">
				<FileAnnotations />
				<PdfViewerTwo pdfUrl={file} />
			</div> */}
		</div>
	);
}

export default App;
