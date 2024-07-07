import { NextResponse } from "next/server";
const ytdl = require("ytdl-core");
const url = require("url");
const fetch = require("node-fetch");

export const POST = async (req) => {
	try {
		const jsonBody = await req.json();
		const videoId = jsonBody.videoId;

		if (!videoId) {
			return NextResponse.json(
				{
					success: false,
					error: "Provide videoId parameter.",
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

		const qualityOrder = {
			"2160p": 0,
			"1440p": 1,
			"1080p": 2,
			"720p": 3,
			"480p": 4,
			"360p": 5,
			"240p": 6,
			"144p": 7,
		};

		const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

		const info = await ytdl.getInfo(videoUrl);

		const formatData = await Promise.all(
			info.formats
				.sort((a, b) => {
					const qualityA =
						qualityOrder[a.qualityLabel] !== undefined
							? qualityOrder[a.qualityLabel]
							: 8; // Assign a higher order for audio
					const qualityB =
						qualityOrder[b.qualityLabel] !== undefined
							? qualityOrder[b.qualityLabel]
							: 8; // Assign a higher order for audio

					if (qualityA !== qualityB) {
						return qualityA - qualityB;
					}

					return a.mimeType.localeCompare(b.mimeType);
				})
				.filter(
					(value) =>
						(value.qualityLabel && value.audioQuality) ||
						(value.audioQuality &&
							!value.qualityLabel &&
							value.mimeType.includes("mp4")),
				)
				.map(async (value) => {
					if (!value.contentLength) {
						try {
							const parsed = url.parse(value.url);
							parsed.method = "HEAD";
							const res = await fetch(value.url, { method: "HEAD" });
							return {
								...value,
								contentLength: res.headers.get("content-length"),
							};
						} catch (err) {
							console.error("Error fetching content length:", err);
							return value;
						}
					}
					return value;
				}),
		);

		if (info.player_response.videoDetails.isPrivate) {
			return NextResponse.json(
				{
					success: false,
					error: "Can't download private content.",
				},
				{
					status: 400,
				},
			);
		}
		if (info.player_response.videoDetails.isLiveContent) {
			return NextResponse.json(
				{
					success: false,
					error: "Can't download live content.",
				},
				{
					status: 400,
				},
			);
		}

		return NextResponse.json(
			{
				success: true,
				details: {
					...info.player_response.videoDetails,
					...info.videoDetails,
				},
				formats: formatData,
			},
			{
				status: 200,
			},
		);
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
