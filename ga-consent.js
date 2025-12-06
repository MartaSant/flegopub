// Google Analytics 4 Consent Management
// Template per integrazione in altri progetti
// 
// ISTRUZIONI:
// 1. Modifica GA_MEASUREMENT_ID con il tuo ID GA4 (riga 6)
// 2. (Opzionale) Modifica CONSENT_KEY se necessario (riga 7)
// 3. Salva questo file come "ga-consent.js" nel tuo progetto
// 4. Includi questo file in tutte le pagine: <script src="ga-consent.js"></script>

console.log('ga-consent.js caricato');

// ⚙️ CONFIGURAZIONE - MODIFICA QUESTI VALORI
// ⚠️ IMPORTANTE: L'AI deve chiedere all'utente il suo ID Google Analytics 4 e sostituirlo qui
const GA_MEASUREMENT_ID = 'G-LKFE31RGZ9'; // ⬅️ SOSTITUISCI CON IL TUO ID GA4 (formato: G-XXXXXXXXXX)
const CONSENT_KEY = 'ga_consent'; // ⬅️ (Opzionale) Cambia se necessario

// Esponi CONSENT_KEY globalmente per uso in tutte le pagine
window.CONSENT_KEY = CONSENT_KEY;

// Verifica se l'utente ha già dato il consenso
function hasAnalyticsConsent() {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === 'granted';
}

// Flag per tracciare se GA4 è in fase di caricamento
let ga4Loading = false;
let ga4Ready = false;

// Esponi i flag globalmente per verifiche tra pagine
window.ga4Ready = false;
window.ga4Loading = false;

// Carica Google Analytics 4 solo se il consenso è stato dato
function loadGA4() {
    console.log('loadGA4 chiamato');
    
    // Se GA è già caricato e pronto, esci
    // Controlla sia la variabile locale che quella globale (per pagine diverse)
    if ((ga4Ready || window.ga4Ready) && window.gtag && window.dataLayer && typeof window.gtag === 'function') {
        console.log('GA4 già caricato e pronto');
        ga4Ready = true;
        window.ga4Ready = true;
        
        // Se il consenso è stato dato, aggiorna il consenso e abilita il tracking
        if (hasAnalyticsConsent()) {
            gtag('consent', 'update', {
                'ad_storage': 'granted',
                'analytics_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
            
            // Riconfigura GA4 per abilitare il tracking
            gtag('config', GA_MEASUREMENT_ID, {
                'send_page_view': true
            });
            
            // Invia manualmente page_view per assicurarsi che venga tracciato
            setTimeout(function() {
                if (window.gtag && typeof window.gtag === 'function') {
                    gtag('event', 'page_view', {
                        'page_title': document.title,
                        'page_location': window.location.href,
                        'page_path': window.location.pathname
                    });
                    console.log('Page view inviato manualmente (GA4 già pronto)');
                }
            }, 100);
        }
        return;
    }
    
    // Se GA4 è in fase di caricamento, esci
    if (ga4Loading || window.ga4Loading) {
        console.log('GA4 già in fase di caricamento');
        return;
    }
    
    // Se il consenso non è stato dato, esci
    if (!hasAnalyticsConsent()) {
        console.log('Consenso non dato, GA4 non caricato');
        return;
    }
    
    console.log('Caricamento GA4...');
    ga4Loading = true;
    window.ga4Loading = true;
    
    // Verifica se gtag è già presente (caricato dall'head)
    if (window.gtag && typeof window.gtag === 'function') {
        console.log('gtag già presente nell\'head, aggiorno solo il consenso');
        // Il tag è già presente nell'head, aggiorna solo il consenso
        gtag('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted'
        });
        
        // Riconfigura GA4 per abilitare il tracking
        gtag('config', GA_MEASUREMENT_ID, {
            'send_page_view': true
        });
        
        // Invia manualmente page_view per assicurarsi che venga tracciato
        // Questo è necessario perché la riconfigurazione potrebbe non inviare automaticamente il page_view
        setTimeout(function() {
            if (window.gtag && typeof window.gtag === 'function') {
                gtag('event', 'page_view', {
                    'page_title': document.title,
                    'page_location': window.location.href,
                    'page_path': window.location.pathname
                });
                console.log('Page view inviato manualmente (tag già presente)');
            }
        }, 100);
        
        ga4Loading = false;
        ga4Ready = true;
        window.ga4Loading = false;
        window.ga4Ready = true;
        console.log('GA4 abilitato (tag già presente nell\'head)');
        return;
    }
    
    // Se gtag non è presente, inizializza dataLayer e carica lo script
    // Inizializza dataLayer PRIMA di qualsiasi chiamata gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    
    // Imposta Google Consent Mode v2 con tutti i storage negati di default
    // Questo deve essere fatto PRIMA di caricare lo script GA4
    gtag('consent', 'default', {
        'ad_storage': 'denied',
        'analytics_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });
    
    // Carica lo script GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    
    // Inizializza GA4 quando lo script è caricato
    script.onload = function() {
        console.log('Script GA4 caricato, inizializzo...');
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            'send_page_view': true  // Assicura che page_view venga inviato
        });
        ga4Loading = false;
        ga4Ready = true;
        window.ga4Loading = false;
        window.ga4Ready = true;
        console.log('GA4 inizializzato e pronto');
        
        // Aggiorna il consenso dopo che GA4 è caricato
        gtag('consent', 'update', {
            'ad_storage': 'granted',
            'analytics_storage': 'granted',
            'ad_user_data': 'granted',
            'ad_personalization': 'granted'
        });
        
        // Forza l'invio di page_view dopo aver aggiornato il consenso
        // Questo è importante per le pagine caricate dopo l'accettazione dei cookie
        setTimeout(function() {
            if (window.gtag && typeof window.gtag === 'function') {
                // Invia page_view manualmente per assicurarsi che venga tracciato
                gtag('event', 'page_view', {
                    'page_title': document.title,
                    'page_location': window.location.href,
                    'page_path': window.location.pathname
                });
                console.log('Page view inviato manualmente (script caricato dinamicamente)');
            }
        }, 300);
    };
    
    script.onerror = function() {
        console.error('Errore nel caricamento dello script GA4');
        ga4Loading = false;
        window.ga4Loading = false;
    };
    
    document.head.appendChild(script);
}

// Funzione helper per inviare eventi GA4 (aspetta che GA4 sia pronto)
function sendGA4Event(eventName, eventParams) {
    // Se GA4 è pronto, invia subito
    // Controlla sia la variabile locale che quella globale
    if ((ga4Ready || window.ga4Ready) && window.gtag && typeof window.gtag === 'function') {
        try {
            window.gtag('event', eventName, eventParams);
            if (window.dataLayer) {
                window.dataLayer.push({
                    'event': eventName,
                    ...eventParams
                });
            }
            return true;
        } catch (e) {
            console.error('Errore invio evento GA4:', e);
            return false;
        }
    }
    
    // Se dataLayer esiste ma GA4 non è ancora pronto, salva l'evento
    if (window.dataLayer) {
        try {
            window.dataLayer.push({
                'event': eventName,
                ...eventParams
            });
            
            // Se GA4 è in fase di caricamento, aspetta che sia pronto e reinvia
            if (ga4Loading || window.ga4Loading || hasAnalyticsConsent()) {
                const checkReady = setInterval(function() {
                    if ((ga4Ready || window.ga4Ready) && window.gtag && typeof window.gtag === 'function') {
                        try {
                            window.gtag('event', eventName, eventParams);
                        } catch (e) {
                            console.error('Errore reinvio evento GA4:', e);
                        }
                        clearInterval(checkReady);
                    }
                }, 100);
                
                // Timeout dopo 5 secondi
                setTimeout(function() {
                    clearInterval(checkReady);
                }, 5000);
            }
            return true;
        } catch (e) {
            console.error('Errore salvataggio evento in dataLayer:', e);
            return false;
        }
    }
    
    return false;
}

// Esponi la funzione globalmente per uso in altre pagine
window.sendGA4Event = sendGA4Event;
// Esponi anche loadGA4 globalmente per uso in altre pagine
window.loadGA4 = loadGA4;

// Funzione per fermare GA4 quando il consenso viene negato
function stopGA4() {
    console.log('stopGA4 chiamato - fermo GA4');
    
    // Aggiorna il consenso mode a "denied" per fermare il tracking
    if (window.gtag && typeof window.gtag === 'function') {
        try {
            gtag('consent', 'update', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
            });
            console.log('Consenso GA4 aggiornato a denied');
        } catch (e) {
            console.error('Errore aggiornamento consenso GA4:', e);
        }
    }
    
    // Resetta i flag
    ga4Ready = false;
    window.ga4Ready = false;
    ga4Loading = false;
    window.ga4Loading = false;
    
    // Rimuovi lo script GA4 dal DOM se esiste
    const ga4Script = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    if (ga4Script) {
        ga4Script.remove();
        console.log('Script GA4 rimosso dal DOM');
    }
    
    // Rimuovi anche il dataLayer o resettalo (opzionale, potrebbe essere usato da altri script)
    // Non rimuoviamo completamente dataLayer per evitare errori, ma lo svuotiamo
    if (window.dataLayer) {
        // Manteniamo dataLayer ma non inviamo più eventi
        console.log('DataLayer mantenuto ma non verrà più utilizzato');
    }
    
    console.log('GA4 fermato');
}

// Esponi stopGA4 globalmente
window.stopGA4 = stopGA4;

// Gestisce il banner dei cookie
function initCookieBanner() {
    console.log('initCookieBanner chiamato');
    
    // Aspetta un po' per assicurarsi che il DOM sia completamente caricato
    setTimeout(function() {
        const banner = document.getElementById('cookie-banner');
        const acceptBtn = document.getElementById('cookie-accept');
        const rejectBtn = document.getElementById('cookie-reject');
        
        // Leggi il consenso esistente
        const consent = localStorage.getItem(CONSENT_KEY);
        
        console.log('Cookie Banner Init:', {
            banner: !!banner,
            acceptBtn: !!acceptBtn,
            rejectBtn: !!rejectBtn,
            consent: consent,
            bannerElement: banner
        });
        
        // Se il banner non esiste (es. index.html senza banner), 
        // carica comunque GA4 se il consenso è già stato dato
        if (!banner || !acceptBtn || !rejectBtn) {
            console.log('Banner o pulsanti non trovati, controllo consenso esistente');
            if (consent === 'granted') {
                console.log('Consenso già dato, carico GA4');
                loadGA4();
            }
            return;
        }
        
        // NUOVA LOGICA:
        // - Se consenso è "granted": nascondi banner (non mostrare più)
        // - Se consenso è "denied": mostra banner (riproponi ad ogni load)
        // - Se non c'è consenso: mostra banner (prima visita o consenso rimosso)
        
        if (consent === 'granted') {
            // Consenso accettato: nascondi banner e carica GA4
            console.log('Consenso granted, nascondo banner e carico GA4');
            banner.style.display = 'none';
            loadGA4();
            return;
        }
        
        // Se consenso è "denied" o non esiste, mostra il banner
        // Questo permette di riproporre il banner se l'utente ha negato il consenso
        // o se non ha ancora dato una risposta
        console.log('Consenso denied o non presente, mostro banner');
        banner.style.display = 'block';
        console.log('Banner display impostato a block, valore attuale:', banner.style.display);
        
        // Gestisci click su "Accetta"
        acceptBtn.addEventListener('click', function() {
            console.log('Click su Accetta');
            // Salva il consenso - questo è condiviso tra tutte le pagine
            localStorage.setItem(CONSENT_KEY, 'granted');
            
            // Trigger evento personalizzato per sincronizzare altre pagine/iframe
            // Questo è importante per aggiornare le pagine aperte in altre tab/iframe
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONSENT_KEY,
                    newValue: 'granted',
                    oldValue: localStorage.getItem(CONSENT_KEY),
                    storageArea: localStorage
                }));
            } catch (e) {
                // Fallback per browser che non supportano StorageEvent personalizzato
                console.log('StorageEvent non supportato, uso fallback');
            }
            
            // Carica GA4
            loadGA4();
            
            // Il consenso verrà aggiornato automaticamente quando GA4 è caricato
            // (vedi script.onload in loadGA4())
            
            // Nascondi il banner
            banner.style.display = 'none';
        });
        
        // Gestisci click su "Rifiuta"
        rejectBtn.addEventListener('click', function() {
            console.log('Click su Rifiuta');
            // Salva il rifiuto - questo è condiviso tra tutte le pagine
            localStorage.setItem(CONSENT_KEY, 'denied');
            
            // Trigger evento personalizzato per sincronizzare altre pagine/iframe
            // Questo è importante per aggiornare le pagine aperte in altre tab/iframe
            try {
                window.dispatchEvent(new StorageEvent('storage', {
                    key: CONSENT_KEY,
                    newValue: 'denied',
                    oldValue: localStorage.getItem(CONSENT_KEY),
                    storageArea: localStorage
                }));
            } catch (e) {
                // Fallback per browser che non supportano StorageEvent personalizzato
                console.log('StorageEvent non supportato, uso fallback');
            }
            
            // Ferma GA4 se è caricato
            if (window.stopGA4 && typeof window.stopGA4 === 'function') {
                window.stopGA4();
            }
            
            // NON nascondere il banner: verrà riproposto al prossimo load di pagina
            // Questo permette all'utente di cambiare idea in futuro
            // Il banner verrà mostrato di nuovo quando l'utente naviga o ricarica la pagina
            banner.style.display = 'none';
            
            // NON caricare GA4
        });
    }, 100);
}

// Funzione per inviare page_view se il consenso è già stato dato
function sendPageViewIfConsented() {
    if (hasAnalyticsConsent()) {
        // Verifica che gtag sia disponibile, se non lo è aspetta
        const checkGtag = setInterval(function() {
            if (window.gtag && typeof window.gtag === 'function' && window.dataLayer) {
                clearInterval(checkGtag);
                // Aggiorna il consenso per essere sicuri
                gtag('consent', 'update', {
                    'ad_storage': 'granted',
                    'analytics_storage': 'granted',
                    'ad_user_data': 'granted',
                    'ad_personalization': 'granted'
                });
                // Invia page_view
                gtag('event', 'page_view', {
                    'page_title': document.title,
                    'page_location': window.location.href,
                    'page_path': window.location.pathname
                });
                console.log('Page view inviato automaticamente (consenso già dato)');
            }
        }, 100);
        
        // Timeout di sicurezza dopo 3 secondi
        setTimeout(function() {
            clearInterval(checkGtag);
        }, 3000);
    }
}

// Inizializza quando il DOM è pronto
console.log('Stato DOM:', document.readyState);
if (document.readyState === 'loading') {
    console.log('DOM in caricamento, aspetto DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded evento, inizializzo banner');
        initCookieBanner();
        // Se il consenso è già stato dato, invia page_view
        sendPageViewIfConsented();
    });
} else {
    console.log('DOM già pronto, inizializzo banner immediatamente');
    initCookieBanner();
    // Se il consenso è già stato dato, invia page_view
    sendPageViewIfConsented();
}

// Ascolta i cambiamenti di localStorage per rilevare quando il consenso viene dato in altre pagine/iframe
// Questo è utile per index.html che contiene un iframe con home.html
window.addEventListener('storage', function(e) {
    if (e.key === CONSENT_KEY && e.newValue === 'granted') {
        // Il consenso è stato dato in un'altra pagina/iframe, carica GA4
        if (!window.gtag || !window.dataLayer || typeof window.gtag !== 'function') {
            loadGA4();
        } else {
            // GA4 è già caricato, aggiorna solo i flag
            ga4Ready = true;
            window.ga4Ready = true;
        }
    } else if (e.key === CONSENT_KEY && e.newValue === 'denied') {
        // Il consenso è stato negato in un'altra pagina/iframe, ferma GA4
        stopGA4();
    }
});

// Per iframe same-origin, l'evento storage potrebbe non funzionare
// Quindi controlliamo periodicamente se il consenso è stato dato
// Questo è importante per index.html che contiene un iframe con home.html
// o per pagine che non hanno il banner principale ma devono reagire al consenso
if (document.getElementById('cookie-banner') === null) {
    // Se non c'è banner in questa pagina, controlla periodicamente il consenso
    let lastConsent = localStorage.getItem(CONSENT_KEY);
    const checkConsent = setInterval(function() {
        const currentConsent = localStorage.getItem(CONSENT_KEY);
        // Se il consenso è cambiato da "non dato" a "granted", carica GA4
        if (currentConsent === 'granted' && lastConsent !== 'granted') {
            if (!window.gtag || !window.dataLayer || typeof window.gtag !== 'function') {
                loadGA4();
            } else {
                // GA4 è già caricato, aggiorna solo i flag
                ga4Ready = true;
                window.ga4Ready = true;
            }
            clearInterval(checkConsent);
        }
        lastConsent = currentConsent;
        
        // Se GA4 è già caricato, ferma il controllo
        if (window.gtag && window.dataLayer && typeof window.gtag === 'function') {
            ga4Ready = true;
            window.ga4Ready = true;
            clearInterval(checkConsent);
        }
    }, 300);
    
    // Ferma il controllo dopo 15 secondi (dopo quel tempo, l'utente avrà già accettato o rifiutato)
    setTimeout(function() {
        clearInterval(checkConsent);
    }, 15000);
}

