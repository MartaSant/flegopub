/**
 * Carrello ordini Flègo → invio riepilogo via WhatsApp (solo client, ID strategia A).
 */
(function () {
    'use strict';

    var CART_KEY = 'flego_cart';
    var FLEGO_WHATSAPP_E164 = '393207682949';
    /** Limite conservativo caratteri per `text=` dopo encodeURIComponent (URL totale ~2048 su molti client). */
    var WA_TEXT_SAFE_CHARS = 1600;

    function isFileProtocol() {
        return window.location.protocol === 'file:';
    }

    function getCartRaw() {
        try {
            var json = localStorage.getItem(CART_KEY);
            if ((!json || json === 'null') && isFileProtocol()) {
                json = sessionStorage.getItem(CART_KEY);
            }
            if (!json || json === 'null') return '[]';
            return json;
        } catch (e) {
            return '[]';
        }
    }

    function getCart() {
        try {
            var arr = JSON.parse(getCartRaw());
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(lines) {
        try {
            var json = JSON.stringify(lines);
            localStorage.setItem(CART_KEY, json);
            if (isFileProtocol()) {
                try {
                    sessionStorage.setItem(CART_KEY, json);
                } catch (e2) { /* ignore */ }
            }
        } catch (e) {
            console.error('flego cart save', e);
        }
    }

    function lineKey(nome, prezzoRaw) {
        return nome.trim() + '|' + (prezzoRaw || '').trim();
    }

    function parsePriceEuro(raw) {
        if (!raw) return NaN;
        var s = String(raw).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        s = s.replace(/€/g, '').replace(/EUR/gi, '').trim();
        s = s.replace(/\./g, '').replace(',', '.');
        var n = parseFloat(s);
        return isNaN(n) ? NaN : n;
    }

    function addToCartLine(product) {
        var nome = product.nome;
        var prezzoRaw = product.prezzo || '';
        var key = lineKey(nome, prezzoRaw);
        var lines = getCart();
        var found = false;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].lineId === key) {
                lines[i].qty = (lines[i].qty || 1) + 1;
                found = true;
                break;
            }
        }
        if (!found) {
            lines.push({
                lineId: key,
                nome: nome,
                prezzoRaw: prezzoRaw,
                qty: 1
            });
        }
        saveCart(lines);
        refreshCartUI();
        try {
            window.dispatchEvent(new CustomEvent('flego-cart-updated'));
        } catch (e) { /* ignore */ }
    }

    function setQty(lineId, qty) {
        var lines = getCart();
        var q = parseInt(qty, 10);
        if (isNaN(q) || q < 1) q = 1;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].lineId === lineId) {
                lines[i].qty = q;
                break;
            }
        }
        saveCart(lines);
        refreshCartUI();
    }

    function removeLine(lineId) {
        var lines = getCart().filter(function (l) {
            return l.lineId !== lineId;
        });
        saveCart(lines);
        refreshCartUI();
    }

    function clearCart() {
        saveCart([]);
        refreshCartUI();
    }

    function cartItemCount() {
        return getCart().reduce(function (acc, l) {
            return acc + (l.qty || 1);
        }, 0);
    }

    function formatMoneyIt(n) {
        return n.toFixed(2).replace('.', ',') + ' €';
    }

    function cartTotals() {
        var lines = getCart();
        var sum = 0;
        var priced = 0;
        var unp = 0;
        for (var i = 0; i < lines.length; i++) {
            var p = parsePriceEuro(lines[i].prezzoRaw);
            if (!isNaN(p)) {
                sum += p * (lines[i].qty || 1);
                priced++;
            } else {
                unp++;
            }
        }
        return { sum: sum, pricedLines: priced, unparsed: unp };
    }

    function generateOrderId() {
        var d = new Date();
        function pad(n) {
            return n < 10 ? '0' + n : '' + n;
        }
        var y = d.getFullYear();
        var m = pad(d.getMonth() + 1);
        var day = pad(d.getDate());
        var h = pad(d.getHours());
        var min = pad(d.getMinutes());
        var s = pad(d.getSeconds());
        var alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        var len = 4;
        var bytes = new Uint8Array(len);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (var i = 0; i < len; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        var rand = '';
        for (var j = 0; j < len; j++) {
            rand += alphabet[bytes[j] % alphabet.length];
        }
        return 'FLG-' + y + m + day + '-' + h + min + s + '-' + rand;
    }

    function buildWhatsAppMessage(orderId, tableCode, note) {
        var lines = getCart();
        var parts = [];
        parts.push('*ORDINE ' + orderId + '*');
        parts.push('Flègo · Sorsi & Morsi');
        parts.push('');
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            parts.push('• ' + l.nome + ' ×' + (l.qty || 1) + ' — ' + (l.prezzoRaw || '').replace(/\s+/g, ' ').trim());
        }
        parts.push('');
        var t = cartTotals();
        if (t.pricedLines > 0) {
            parts.push('*Totale (solo voci con prezzo):* ' + formatMoneyIt(t.sum));
        }
        if (t.unparsed > 0) {
            parts.push('_Altre voci senza totale automatico nel messaggio._');
        }
        if (tableCode && String(tableCode).trim()) {
            parts.push('');
            parts.push('*Codice tavolo:* ' + String(tableCode).trim());
        }
        if (note && String(note).trim()) {
            parts.push('');
            parts.push('*Nota:* ' + String(note).trim());
        }
        parts.push('');
        parts.push('_Inviato dal menu online_');
        return parts.join('\n');
    }

    function waUrlForText(text) {
        return 'https://wa.me/' + FLEGO_WHATSAPP_E164 + '?text=' + encodeURIComponent(text);
    }

    var els = {};

    function ensureShell() {
        if (document.getElementById('flego-cart-fab')) return;
        var fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'flego-cart-fab';
        fab.className = 'flego-cart-fab';
        fab.setAttribute('aria-label', 'Apri carrello ordini');
        fab.innerHTML = '<i class="fas fa-shopping-cart" aria-hidden="true"></i><span class="flego-cart-fab-badge" id="flego-cart-fab-badge" hidden>0</span>';
        fab.addEventListener('click', function () {
            openDrawer();
        });

        var overlay = document.createElement('div');
        overlay.id = 'flego-cart-overlay';
        overlay.className = 'flego-cart-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.addEventListener('click', closeDrawer);

        var drawer = document.createElement('div');
        drawer.id = 'flego-cart-drawer';
        drawer.className = 'flego-cart-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-labelledby', 'flego-cart-title');
        drawer.innerHTML =
            '<div class="flego-cart-drawer-head">' +
            '<h2 id="flego-cart-title" class="flego-cart-drawer-title">Il tuo ordine</h2>' +
            '<button type="button" class="flego-cart-drawer-close" aria-label="Chiudi carrello"><i class="fas fa-times"></i></button>' +
            '</div>' +
            '<div id="flego-cart-drawer-body" class="flego-cart-drawer-body"></div>' +
            '<label class="flego-cart-note-label" for="flego-cart-table">Codice tavolo (opzionale)</label>' +
            '<input type="text" id="flego-cart-table" class="flego-cart-table" maxlength="40" placeholder="Es. 12, A3…" autocomplete="off">' +
            '<label class="flego-cart-note-label" for="flego-cart-note">Nota (opzionale)</label>' +
            '<textarea id="flego-cart-note" class="flego-cart-note" rows="2" placeholder="Es. orario, richieste…"></textarea>' +
            '<div id="flego-cart-total" class="flego-cart-total"></div>' +
            '<div id="flego-cart-alert" class="flego-cart-alert" role="alert" hidden></div>' +
            '<a id="flego-cart-send" class="flego-cart-send" role="button" href="#" target="_blank" rel="noopener noreferrer">Invia ordine con WhatsApp</a>';

        document.body.appendChild(overlay);
        document.body.appendChild(drawer);
        document.body.appendChild(fab);

        drawer.querySelector('.flego-cart-drawer-close').addEventListener('click', closeDrawer);
        document.getElementById('flego-cart-send').addEventListener('click', onSendWhatsAppClick);

        els.fab = fab;
        els.overlay = overlay;
        els.drawer = drawer;
        els.body = document.getElementById('flego-cart-drawer-body');
        els.total = document.getElementById('flego-cart-total');
        els.alert = document.getElementById('flego-cart-alert');
        els.send = document.getElementById('flego-cart-send');
        els.note = document.getElementById('flego-cart-note');
        els.table = document.getElementById('flego-cart-table');
    }

    function hideAlert() {
        if (els.alert) {
            els.alert.hidden = true;
            els.alert.textContent = '';
        }
    }

    function showAlert(msg) {
        if (!els.alert) return;
        els.alert.textContent = msg;
        els.alert.hidden = false;
    }

    function openDrawer() {
        ensureShell();
        hideAlert();
        els.overlay.classList.add('is-open');
        els.drawer.classList.add('is-open');
        document.body.classList.add('flego-cart-drawer-open');
        renderDrawerContent();
    }

    function closeDrawer() {
        if (!els.overlay) return;
        els.overlay.classList.remove('is-open');
        els.drawer.classList.remove('is-open');
        document.body.classList.remove('flego-cart-drawer-open');
        hideAlert();
    }

    function updateFabBadge() {
        ensureShell();
        var badge = document.getElementById('flego-cart-fab-badge');
        if (!badge) return;
        var n = cartItemCount();
        badge.textContent = String(n);
        badge.hidden = n < 1;
    }

    function renderDrawerContent() {
        ensureShell();
        var lines = getCart();
        els.body.innerHTML = '';
        if (lines.length === 0) {
            els.body.innerHTML = '<p class="flego-cart-empty">Il carrello è vuoto. Aggiungi piatti dal menu.</p>';
            els.total.textContent = '';
            setSendLinkEnabled(false);
            return;
        }
        setSendLinkEnabled(true);
        var ul = document.createElement('ul');
        ul.className = 'flego-cart-lines';
        for (var i = 0; i < lines.length; i++) {
            (function (line) {
                var li = document.createElement('li');
                li.className = 'flego-cart-line';
                li.innerHTML =
                    '<div class="flego-cart-line-main">' +
                    '<span class="flego-cart-line-name"></span>' +
                    '<span class="flego-cart-line-price"></span>' +
                    '</div>' +
                    '<div class="flego-cart-line-actions">' +
                    '<button type="button" class="flego-cart-qty" data-act="minus" aria-label="Diminuisci">−</button>' +
                    '<span class="flego-cart-qty-val"></span>' +
                    '<button type="button" class="flego-cart-qty" data-act="plus" aria-label="Aumenta">+</button>' +
                    '<button type="button" class="flego-cart-remove" aria-label="Rimuovi">Rimuovi</button>' +
                    '</div>';
                li.querySelector('.flego-cart-line-name').textContent = line.nome;
                li.querySelector('.flego-cart-line-price').textContent = line.prezzoRaw || '';
                li.querySelector('.flego-cart-qty-val').textContent = String(line.qty || 1);
                li.querySelectorAll('.flego-cart-qty').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var q = line.qty || 1;
                        if (btn.getAttribute('data-act') === 'plus') q++;
                        else q--;
                        if (q < 1) removeLine(line.lineId);
                        else setQty(line.lineId, q);
                        renderDrawerContent();
                    });
                });
                li.querySelector('.flego-cart-remove').addEventListener('click', function () {
                    removeLine(line.lineId);
                    renderDrawerContent();
                });
                ul.appendChild(li);
            })(lines[i]);
        }
        els.body.appendChild(ul);
        var t = cartTotals();
        if (t.pricedLines > 0) {
            els.total.textContent = 'Totale (solo voci con prezzo): ' + formatMoneyIt(t.sum);
        } else {
            els.total.textContent = '';
        }
    }

    function refreshCartUI() {
        updateFabBadge();
        if (els.drawer && els.drawer.classList.contains('is-open')) {
            renderDrawerContent();
        }
    }

    function setSendLinkEnabled(enabled) {
        var a = document.getElementById('flego-cart-send');
        if (!a) return;
        if (enabled) {
            a.removeAttribute('aria-disabled');
            a.classList.remove('flego-cart-send--disabled');
            a.setAttribute('href', '#');
        } else {
            a.setAttribute('aria-disabled', 'true');
            a.classList.add('flego-cart-send--disabled');
            a.setAttribute('href', '#');
        }
    }

    function commitAfterHandoff() {
        clearCart();
        if (els.table) els.table.value = '';
        if (els.note) els.note.value = '';
        hideAlert();
        refreshCartUI();
        closeDrawer();
    }

    /**
     * Un solo controllo: link che apre WhatsApp in nuova scheda (gesto utente → raramente bloccato).
     * In caso di errore (carrello vuoto, messaggio troppo lungo) si fa preventDefault.
     */
    function onSendWhatsAppClick(e) {
        ensureShell();
        hideAlert();
        var lines = getCart();
        if (lines.length === 0) {
            e.preventDefault();
            showAlert('Il carrello è vuoto.');
            return;
        }
        var orderId = generateOrderId();
        var tableEl = document.getElementById('flego-cart-table');
        var noteEl = document.getElementById('flego-cart-note');
        var tableCode = tableEl ? tableEl.value : '';
        var note = noteEl ? noteEl.value : '';
        var msg = buildWhatsAppMessage(orderId, tableCode, note);
        var encodedLen = encodeURIComponent(msg).length;
        if (encodedLen > WA_TEXT_SAFE_CHARS) {
            e.preventDefault();
            showAlert('Ordine troppo lungo per WhatsApp. Riduci le quantità o invia due ordini separati.');
            return;
        }
        var url = waUrlForText(msg);
        e.currentTarget.href = url;
        /* Non svuotare subito: refreshDrawer su carrello vuoto rimette href="#" prima che il browser
           esegua l'azione predefinita del link → su mobile sembra "non succede nulla". */
        setTimeout(function () {
            commitAfterHandoff();
        }, 0);
    }

    function extractProductFromMenuItem(menuItem) {
        var nameElement = menuItem.querySelector('.menu-item-name');
        var priceElement = menuItem.querySelector('.menu-item-price');
        if (!nameElement) return null;
        return {
            nome: nameElement.textContent.trim(),
            prezzo: priceElement ? priceElement.textContent.trim().replace(/\s+/g, ' ') : ''
        };
    }

    function attachAddButtons() {
        var menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(function (menuItem) {
            if (menuItem.querySelector('.add-to-cart-btn')) return;
            var product = extractProductFromMenuItem(menuItem);
            if (!product || !product.nome) return;

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'add-to-cart-btn';
            btn.setAttribute('aria-label', 'Aggiungi al carrello');
            btn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i>';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                addToCartLine(product);
            });

            var headerElement = menuItem.querySelector('.menu-item-header');
            var priceElement = menuItem.querySelector('.menu-item-price');
            if (headerElement && priceElement) {
                var priceInfoContainer = headerElement.querySelector('.menu-item-price-info-container');
                if (priceInfoContainer) {
                    priceInfoContainer.appendChild(btn);
                } else {
                    priceInfoContainer = document.createElement('div');
                    priceInfoContainer.className = 'menu-item-price-info-container';
                    priceElement.parentNode.insertBefore(priceInfoContainer, priceElement);
                    priceInfoContainer.appendChild(priceElement);
                    var detailsBtn = menuItem.querySelector('.details-btn');
                    if (detailsBtn && detailsBtn.parentNode === priceInfoContainer) {
                        /* già nel container */
                    }
                    priceInfoContainer.appendChild(btn);
                }
            } else {
                menuItem.insertBefore(btn, menuItem.firstChild);
            }
        });
    }

    function boot() {
        ensureShell();
        updateFabBadge();
        setTimeout(function () {
            attachAddButtons();
        }, 0);
        window.addEventListener('storage', function (e) {
            if (e.key === CART_KEY) refreshCartUI();
        });
        window.addEventListener('flego-cart-updated', refreshCartUI);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.FlegoOrderCart = {
        attachAddButtons: attachAddButtons
    };
})();
