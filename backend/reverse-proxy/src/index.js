import notFound from './not-found.html';
export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const hostname = url.hostname;

		const hostParts = hostname.split('.');
		const subdomain = hostParts[0];

		const BASE_PATH = 'https://hsl-transcoder.s3.ap-south-1.amazonaws.com/__outputs';
		let path = url.pathname;

		if (path === '/') path += 'index.html';
		const targetUrl = `${BASE_PATH}/${subdomain}${path}`;
		let response = await fetch(targetUrl);
		console.log(targetUrl);
		if (response.status === 404 || response.status === 403) {
			return new Response(notFound, {
				status: 404,
				headers: { 'Content-Type': 'text/html' },
			});
		}
		return response;
	},
};
