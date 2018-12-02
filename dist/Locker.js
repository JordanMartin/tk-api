"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("crypto");
var http = require("http");
var winston_1 = require("winston");
var log = winston_1.createLogger({
    level: 'debug',
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.splat(), winston_1.format.simple()),
    transports: [
        new winston_1.transports.Console()
    ]
});
/**
 * Contrôle d'une serrure connecté TheKeys
 */
var Locker = /** @class */ (function () {
    function Locker(lockerId, gatewayHost, gatewayCode) {
        this.lockerId = lockerId;
        this.gatewayHost = gatewayHost;
        this.gatewayCode = gatewayCode;
    }
    /**
     * Ouvrir la serrure
     */
    Locker.prototype.unlock = function () {
        log.info('Unlocking...');
        return this.apiPost('/open');
    };
    /**
     * Vérouiller la serrure
     */
    Locker.prototype.lock = function () {
        log.info('Locking...');
        return this.apiPost('/close');
    };
    /**
     * Status de la serrure
     */
    Locker.prototype.status = function () {
        log.info('Get status...');
        return this.apiPost('/locker_status');
    };
    /**
     * Génère la chaine d'authentifcation
     * De la forme: identifier=<locker_id>&ts=<ts>&hash=<hash>
     */
    Locker.prototype.generateAuth = function () {
        var timestamp = Math.floor(new Date().getTime() / 1000).toString();
        var hash = this.hash(timestamp, this.gatewayCode);
        return "identifier=" + this.lockerId + "&ts=" + timestamp + "&hash=" + hash;
    };
    /**
     * Calcul le hash (HMAC-SHA256) à partir du timestamp et du code
     *
     * @param timestamp Timestamp à hasher
     * @param code Secret pour
     */
    Locker.prototype.hash = function (timestamp, code) {
        var hmac = crypto.createHmac('sha256', code);
        hmac.update(timestamp);
        return hmac.digest('base64');
    };
    /**
     * Appel l'api avec la chaine d'authentification
     *
     * @param path Chemin vers le service
     */
    Locker.prototype.apiPost = function (path) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            log.debug('> POST ' + _this.gatewayHost + path);
            var authData = _this.generateAuth();
            var options = {
                method: 'POST',
                hostname: _this.gatewayHost,
                path: path,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(authData)
                }
            };
            var req = http.request(options, function (res) {
                log.debug("< " + res.statusCode + " " + res.statusMessage);
                var chunks = [];
                res.on('data', function (chunk) { return chunks.push(chunk); });
                res.on('end', function () { return resolve(Buffer.concat(chunks).toString()); });
            });
            req.on('error', function (err) {
                log.error('Request failed', err);
                reject(err);
            });
            req.write(authData);
            req.end();
        });
    };
    return Locker;
}());
exports.Locker = Locker;
