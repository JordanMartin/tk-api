/**
 * Contrôle d'une serrure connecté TheKeys
 */
export declare class Locker {
    private lockerId;
    private gatewayHost;
    private gatewayCode;
    constructor(lockerId: string, gatewayHost: string, gatewayCode: string);
    /**
     * Ouvrir la serrure
     */
    unlock(): Promise<any>;
    /**
     * Vérouiller la serrure
     */
    lock(): Promise<any>;
    /**
     * Status de la serrure
     */
    status(): Promise<any>;
    /**
     * Génère la chaine d'authentifcation
     * De la forme: identifier=<locker_id>&ts=<ts>&hash=<hash>
     */
    private generateAuth;
    /**
     * Calcul le hash (HMAC-SHA256) à partir du timestamp et du code
     *
     * @param timestamp Timestamp à hasher
     * @param code Secret pour
     */
    private hash;
    /**
     * Appel l'api avec la chaine d'authentification
     *
     * @param path Chemin vers le service
     */
    private apiPost;
}
