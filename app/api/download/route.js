import { NextResponse } from "next/server";
const ytdl = require("ytdl-core");

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

		// Capture content-length from the response
		data.on("response", (response) => {
			headers.set("Content-Length", response.headers["content-length"]);
		});

		// Error handling for the data stream
		data.on("error", (err) => {
			console.error("Error during streaming:", err);
			return NextResponse.json(
				{
					success: false,
					error:
						"Error occurred while downloading video, please, try again later.",
				},
				{
					status: 500,
				},
			);
		});

		return new Response(data, {
			headers: headers,
		});
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
