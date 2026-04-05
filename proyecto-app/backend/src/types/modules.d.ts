declare module "bcryptjs";
declare module "jsonwebtoken";
declare module "resend" {
	type ResendSendResponse = {
		error?: {
			message?: string;
			name?: string;
		} | null;
	};

	export class Resend {
		constructor(apiKey?: string);
		emails: {
			send: (payload: unknown, options?: unknown) => Promise<ResendSendResponse>;
		};
	}
}
