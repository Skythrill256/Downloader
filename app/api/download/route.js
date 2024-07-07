import { NextResponse } from "next/server";
import ytdl from "ytdl-core";

export const POST = async (req) => {
	try {
		const jsonBody = await req.json();
		const { videoId, itag } = jsonBody;

		if (!videoId || !itag) {
			return NextResponse.json(
				{
					success: false,
					error: "Provide videoId and itag parameters.",
				},
				{
					status: 400,
				},
			);
		}

		if (!ytdl.validateID(videoId)) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid videoId parameter.",
				},
				{
					status: 400,
				},
			);
		}

		const info = await ytdl.getBasicInfo(
			`https://www.youtube.com/watch?v=${videoId}`,
		);
		const videoName = info.videoDetails.title;
		const itagExists = info.formats.some((item) => item.itag == itag);

		if (!itagExists) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid quality/format selected.",
				},
				{
					status: 400,
				},
			);
		}

		const headers = new Headers();
		headers.set(
			"Content-Disposition",
			`attachment; filename="${videoName}.mp4"`,
		);
		headers.set("Content-Type", "video/mp4");

		const data = ytdl(videoId, {
			quality: itag,
			filter: (format) => format.itag == itag,
		});

		let contentLength;
		data.on("response", (response) => {
			contentLength = response.headers["content-length"];
			headers.set("Content-Length", contentLength);
		});

		// Capture any errors from the data stream
		data.on("error", (err) => {
			console.error("Error during streaming:", err);
		});

		// Wait until the 'response' event to ensure headers are set correctly
		await new Promise((resolve, reject) => {
			data.on("response", resolve);
			data.on("error", reject);
		});

		return new Response(data, { headers });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Unexpected error occurred, please, try again later.",
			},
			{
				status: 500,
			},
		);
	}
};
