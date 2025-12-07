// Utility per gestione preferiti e dettagli prodotto
// Questo file deve essere incluso in tutte le pagine con prodotti

// Nota: dataLayer è già inizializzato nel tag GA4 nell'head delle pagine
// Le inizializzazioni nelle funzioni sono fallback per sicurezza

// Chiave per salvare i preferiti in localStorage
const FAVORITES_KEY = 'flego_favorites';

// Funzione per Recuperare Preferiti
function getFavorites() {
    try {
        let favorites = localStorage.getItem(FAVORITES_KEY);
        
        // Se non c'è in localStorage e si usa file://, prova sessionStorage come fallback
        if ((!favorites || favorites === 'null' || favorites === 'undefined') && window.location.protocol === 'file:') {
            try {
                const sessionFavorites = sessionStorage.getItem(FAVORITES_KEY);
                if (sessionFavorites && sessionFavorites !== 'null' && sessionFavorites !== 'undefined') {
                    favorites = sessionFavorites;
                }
            } catch (e) {
                // Ignora errori sessionStorage
            }
        }
        
        if (!favorites || favorites === 'null' || favorites === 'undefined') {
            return [];
        }
        
        const parsed = JSON.parse(favorites);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Errore nel recupero dei preferiti:', e);
        return [];
    }
}

// Funzione per Salvare Preferiti
function saveFavorites(favorites) {
    try {
        const jsonData = JSON.stringify(favorites);
        
        // Salva in localStorage
        localStorage.setItem(FAVORITES_KEY, jsonData);
        
        // Se si usa file://, salva anche in sessionStorage come fallback
        if (window.location.protocol === 'file:') {
            try {
                sessionStorage.setItem(FAVORITES_KEY, jsonData);
            } catch (e) {
                // Ignora errori sessionStorage
            }
        }
    } catch (e) {
        console.error('Errore nel salvataggio dei preferiti:', e);
    }
}

// Funzione per Verificare se un Prodotto è Preferito
function isFavorite(productName) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.nome === productName);
}

// Funzione per Aggiungere ai Preferiti
function addToFavorites(product) {
    const favorites = getFavorites();
    if (!isFavorite(product.nome)) {
        favorites.push(product);
        saveFavorites(favorites);
        return true;
    }
    return false;
}

// Funzione per Rimuovere dai Preferiti
function removeFromFavorites(productName) {
    const favorites = getFavorites();
    const filtered = favorites.filter(fav => fav.nome !== productName);
    saveFavorites(filtered);
    return filtered.length < favorites.length;
}

// Funzione Toggle Preferiti (Principale)
function toggleFavorite(product, button) {
    if (isFavorite(product.nome)) {
        // Rimuove dai preferiti
        removeFromFavorites(product.nome);
        button.classList.remove('active');
        button.setAttribute('aria-label', 'Aggiungi ai preferiti');
        
        // Aggiorna icona
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        
        // Google Analytics 4: traccia la rimozione dai preferiti
        try {
            if (window.sendGA4Event) {
                window.sendGA4Event('favorite_removed', {
                    'product_name': product.nome,
                    'product_type': product.tipo || product.categoria || 'prodotto',
                    'product_region': product.regione || '',
                    'product_price': product.prezzo || ''
                });
            } else {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'favorite_removed',
                    'product_name': product.nome,
                    'product_type': product.tipo || product.categoria || 'prodotto',
                    'product_region': product.regione || '',
                    'product_price': product.prezzo || ''
                });
            }
        } catch (e) {
            // Silenzioso: non bloccare l'esperienza utente se GA4 fallisce
        }
    } else {
        // Aggiunge ai preferiti
        addToFavorites(product);
        button.classList.add('active');
        button.setAttribute('aria-label', 'Rimuovi dai preferiti');
        
        // Aggiorna icona
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
        
        // Google Analytics 4: traccia l'aggiunta ai preferiti
        try {
            if (window.sendGA4Event) {
                window.sendGA4Event('favorite_added', {
                    'product_name': product.nome,
                    'product_type': product.tipo || product.categoria || 'prodotto',
                    'product_region': product.regione || '',
                    'product_price': product.prezzo || ''
                });
            } else {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'favorite_added',
                    'product_name': product.nome,
                    'product_type': product.tipo || product.categoria || 'prodotto',
                    'product_region': product.regione || '',
                    'product_price': product.prezzo || ''
                });
            }
        } catch (e) {
            // Silenzioso: non bloccare l'esperienza utente se GA4 fallisce
        }
    }
}

// Funzione per generare informazioni dettagliate del prodotto
function getProductDetails(product) {
    const details = {
        nome: product.nome,
        tipo: product.tipo || product.categoria || 'prodotto',
        regione: product.regione || '',
        prezzo: product.prezzo || '',
        descrizione: '',
        caratteristiche: '',
        abbinamenti: ''
    };
    
    // Usa la descrizione dal prodotto se presente, altrimenti usa una generica
    // Per i taglieri, la descrizione viene estratta dal DOM prima di essere rimossa
    if (product.descrizione && product.descrizione.trim() !== '') {
        // Mantieni i <br> nella descrizione per preservare la formattazione
        details.descrizione = product.descrizione;
    } else {
        details.descrizione = 'Prodotto di qualità, selezionato per la nostra carta.';
    }
    
    // Per i taglieri, non mostriamo caratteristiche e abbinamenti
    // Se la descrizione è presente, significa che è un tagliere e mostriamo solo la descrizione
    if (product.descrizione && product.descrizione.trim() !== '') {
        details.caratteristiche = '';
        details.abbinamenti = '';
    } else {
        details.caratteristiche = 'Prodotto pregiato con caratteristiche uniche, preparato con cura e attenzione ai dettagli.';
        details.abbinamenti = 'Versatile, si abbina a diversi piatti e bevande.';
    }
    
    return details;
}

// Funzione per Mostrare Banner Dettagli
function showProductDetails(product) {
    const details = getProductDetails(product);
    
    // Google Analytics 4: traccia l'apertura del banner dettagli prodotto
    try {
        if (window.sendGA4Event) {
            window.sendGA4Event('product_details_view', {
                'product_name': product.nome,
                'product_type': product.tipo || product.categoria || 'prodotto',
                'product_region': product.regione || '',
                'product_price': product.prezzo || ''
            });
        } else {
            // Fallback se la funzione helper non è ancora disponibile
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                'event': 'product_details_view',
                'product_name': product.nome,
                'product_type': product.tipo || product.categoria || 'prodotto',
                'product_region': product.regione || '',
                'product_price': product.prezzo || ''
            });
        }
    } catch (e) {
        console.error('Errore nell\'invio evento GA4:', e);
    }
    
    // Crea o aggiorna il banner
    let banner = document.getElementById('productDetailsBanner');
    let overlay = document.getElementById('productDetailsOverlay');
    
    if (!banner) {
        // Crea il banner se non esiste
        overlay = document.createElement('div');
        overlay.id = 'productDetailsOverlay';
        overlay.className = 'wine-details-overlay';
        overlay.addEventListener('click', closeProductDetails);
        
        banner = document.createElement('div');
        banner.id = 'productDetailsBanner';
        banner.className = 'wine-details-banner';
        banner.innerHTML = `
            <div class="wine-details-header">
                <h3 class="wine-details-title"></h3>
                <button class="wine-details-close" aria-label="Chiudi dettagli">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="wine-details-content">
                <div class="wine-details-section">
                    <span class="wine-details-label">Descrizione</span>
                    <p class="wine-details-value" id="product-desc"></p>
                </div>
                <div class="wine-details-section">
                    <span class="wine-details-label">Caratteristiche</span>
                    <p class="wine-details-value" id="product-char"></p>
                </div>
                <div class="wine-details-section">
                    <span class="wine-details-label">Abbinamenti</span>
                    <p class="wine-details-value" id="product-pair"></p>
                </div>
            </div>
        `;
        
        // Aggiungi event listener per il bottone chiudi
        const closeBtn = banner.querySelector('.wine-details-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeProductDetails);
        }
        
        document.body.appendChild(overlay);
        document.body.appendChild(banner);
    }
    
    // Aggiorna il contenuto del banner
    banner.querySelector('.wine-details-title').textContent = details.nome;
    
    // Per la descrizione, preserva i <br> se presenti
    const descElement = document.getElementById('product-desc');
    if (details.descrizione.includes('<br>')) {
        descElement.innerHTML = details.descrizione;
    } else {
        descElement.textContent = details.descrizione;
    }
    
    // Mostra caratteristiche e abbinamenti solo se presenti
    const charElement = document.getElementById('product-char');
    const pairElement = document.getElementById('product-pair');
    const charSection = charElement ? charElement.closest('.wine-details-section') : null;
    const pairSection = pairElement ? pairElement.closest('.wine-details-section') : null;
    
    if (details.caratteristiche && details.caratteristiche.trim() !== '') {
        charElement.textContent = details.caratteristiche;
        if (charSection) charSection.style.display = 'block';
    } else {
        if (charSection) charSection.style.display = 'none';
    }
    
    if (details.abbinamenti && details.abbinamenti.trim() !== '') {
        pairElement.textContent = details.abbinamenti;
        if (pairSection) pairSection.style.display = 'block';
    } else {
        if (pairSection) pairSection.style.display = 'none';
    }
    
    // Mostra il banner
    overlay.style.display = 'block';
    banner.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(function() {
        overlay.classList.add('show');
        banner.classList.add('show');
    }, 10);
}

// Funzione per chiudere il banner
function closeProductDetails() {
    const banner = document.getElementById('productDetailsBanner');
    const overlay = document.getElementById('productDetailsOverlay');
    
    if (banner && overlay) {
        banner.classList.remove('show');
        overlay.classList.remove('show');
        
        setTimeout(function() {
            banner.style.display = 'none';
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// Funzione per inizializzare i bottoni su tutti i prodotti
function initProductButtons() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(function(menuItem) {
        // Estrai informazioni del prodotto
        const nameElement = menuItem.querySelector('.menu-item-name');
        const priceElement = menuItem.querySelector('.menu-item-price');
        const descElement = menuItem.querySelector('.menu-item-desc');
        
        if (!nameElement) return;
        
        const productName = nameElement.textContent.trim();
        const productPrice = priceElement ? priceElement.textContent.trim().replace(/\s+/g, ' ') : '';
        // Estrai la descrizione preservando i <br> se presenti
        let productDesc = '';
        if (descElement) {
            // Se la descrizione contiene <br>, preservali
            const descHTML = descElement.innerHTML.trim();
            if (descHTML.includes('<br>')) {
                productDesc = descHTML;
            } else {
                productDesc = descElement.textContent.trim();
            }
        }
        
        const product = {
            nome: productName,
            prezzo: productPrice,
            descrizione: productDesc,
            tipo: '',
            categoria: '',
            regione: ''
        };
        
        // Verifica se il prodotto è già nei preferiti
        const isFav = isFavorite(product.nome);
        
        // Aggiungi bottone preferiti se non esiste già
        if (!menuItem.querySelector('.favorite-btn')) {
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'favorite-btn' + (isFav ? ' active' : '');
            favoriteBtn.setAttribute('aria-label', isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti');
            favoriteBtn.setAttribute('data-product-name', product.nome);
            favoriteBtn.innerHTML = '<i class="' + (isFav ? 'fas' : 'far') + ' fa-heart"></i>';
            favoriteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleFavorite(product, favoriteBtn);
            });
            menuItem.insertBefore(favoriteBtn, menuItem.firstChild);
        }
        
        // Aggiungi bottone INFO se non esiste già
        if (!menuItem.querySelector('.details-btn')) {
            const headerElement = menuItem.querySelector('.menu-item-header');
            if (headerElement && priceElement) {
                // Crea un contenitore per prezzo e bottone INFO
                let priceInfoContainer = headerElement.querySelector('.menu-item-price-info-container');
                if (!priceInfoContainer) {
                    priceInfoContainer = document.createElement('div');
                    priceInfoContainer.className = 'menu-item-price-info-container';
                    
                    // Sposta il prezzo nel contenitore (mantiene la posizione originale)
                    priceElement.parentNode.insertBefore(priceInfoContainer, priceElement);
                    priceInfoContainer.appendChild(priceElement);
                }
                
                const detailsBtn = document.createElement('button');
                detailsBtn.className = 'details-btn';
                detailsBtn.setAttribute('aria-label', 'Mostra dettagli');
                detailsBtn.setAttribute('data-product-name', product.nome);
                detailsBtn.textContent = 'INFO';
                detailsBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showProductDetails(product);
                });
                
                // Aggiungi il bottone nel contenitore sotto il prezzo
                priceInfoContainer.appendChild(detailsBtn);
            }
        }
    });
}

// Inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductButtons);
} else {
    initProductButtons();
}

