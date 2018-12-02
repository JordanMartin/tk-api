import * as crypto from 'crypto';
import * as http from 'http';
import { createLogger, transports, format } from 'winston';

const log = createLogger({
	level: 'debug',
	format: format.combine(
		format.colorize(),
		format.splat(),
		format.simple()
	),
	transports: [
		new transports.Console()
	]
});

/**
 * Contrôle d'une serrure connecté TheKeys
 */
export class Locker {

	constructor(
		private lockerId: string,
		private gatewayHost: string,
		private gatewayCode: string
	) { }

	/**
	 * Ouvrir la serrure
	 */
	public unlock(): Promise<any> {
		log.info('Unlocking...');
		return this.apiPost('/open');
	}

	/**
	 * Vérouiller la serrure
	 */
	public lock(): Promise<any> {
		log.info('Locking...');
		return this.apiPost('/close');
	}

	/**
	 * Status de la serrure
	 */
	public status(): Promise<any> {
		log.info('Get status...');
		return this.apiPost('/locker_status');
	}

	/**
	 * Génère la chaine d'authentifcation
	 * De la forme: identifier=<locker_id>&ts=<ts>&hash=<hash>
	 */
	private generateAuth(): string {
		const timestamp = Math.floor(new Date().getTime() / 1000).toString();
		const hash = this.hash(timestamp, this.gatewayCode);
		return `identifier=${this.lockerId}&ts=${timestamp}&hash=${hash}`;
	}

	/**
	 * Calcul le hash (HMAC-SHA256) à partir du timestamp et du code
	 * 
	 * @param timestamp Timestamp à hasher
	 * @param code Secret pour 
	 */
	private hash(timestamp: string, code: string) {
		const hmac = crypto.createHmac('sha256', code);
		hmac.update(timestamp);
		return hmac.digest('base64');
	}

	/**
	 * Appel l'api avec la chaine d'authentification
	 * 
	 * @param path Chemin vers le service
	 */
	private apiPost(path: string) {
		return new Promise((resolve, reject) => {

			log.debug('> POST ' + this.gatewayHost + path)

			const authData = this.generateAuth();

			const options = {
				method: 'POST',
				hostname: this.gatewayHost,
				path: path,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': Buffer.byteLength(authData)
				}
			};

			const req = http.request(options, (res) => {
				log.debug(`< ${res.statusCode} ${res.statusMessage}`);

				const chunks: any[] = [];
				res.on('data', chunk => chunks.push(chunk));
				res.on('end', () => resolve(Buffer.concat(chunks).toString()));
			});

			req.on('error', (err) => {
				log.error('Request failed', err);
				reject(err);
			});

			req.write(authData);
			req.end();
		});
	}
}
