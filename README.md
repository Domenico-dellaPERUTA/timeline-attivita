## Struttura 


```
timeline-attivita/
├── app/
│   ├── api/
│   │   ├── progetti/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── filters/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── lib/
│   ├── db.ts
│   └── init-db.sql
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json

```
## Deploy e Configurazione del Servizio

### Prerequisiti
- macOS
- Node.js installato
- Permessi di amministratore

### Deploy dell'applicazione

1. **Da Visual Studio Code** (metodo consigliato):
   - Apri la sidebar "Run and Debug" (icona play con bug)
   - Seleziona "🚀 Deploy App" dal dropdown
   - Clicca il pulsante play verde ▶️
   
2. **Da terminale**:
```bash
   ./deploy.sh
```

Lo script esegue automaticamente:
- Build dell'applicazione (`npm run build`)
- Copia dei file in `/Library/WebServer/Activity`
- Installazione delle dipendenze di produzione
- Riavvio del servizio

### Configurazione del servizio LaunchDaemon

Per far partire automaticamente l'applicazione all'avvio del sistema per tutti gli utenti:

#### 1. Crea il file LaunchDaemon
```bash
sudo nano /Library/LaunchDaemons/com.activity.next.plist
```

#### 2. Inserisci questa configurazione
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist>
<dict>
    <key>Label</key>
    <string>com.activity.next</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Library/WebServer/Activity/node_modules/.bin/next</string>
        <string>start</string>
        <string>-p</string>
        <string>3000</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>/Library/WebServer/Activity</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/Library/Logs/activity-next-stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Library/Logs/activity-next-stderr.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
```

**Note importanti:**
- Se usi Apple Silicon o Homebrew, il percorso di Node.js potrebbe essere `/opt/homebrew/bin/node`. Verifica con `which node`
- La porta predefinita è 3000, modificabile cambiando il valore dopo `-p`

#### 3. Imposta i permessi corretti
```bash
sudo chown root:wheel /Library/LaunchDaemons/com.activity.next.plist
sudo chmod 644 /Library/LaunchDaemons/com.activity.next.plist
```

#### 4. Carica e avvia il servizio
```bash
sudo launchctl load /Library/LaunchDaemons/com.activity.next.plist
sudo launchctl start com.activity.next
```

#### 5. Verifica lo stato del servizio
```bash
sudo launchctl list | grep com.activity.next
```

### Comandi utili

#### Controllare i log
```bash
# Log output
tail -f /Library/Logs/activity-next-stdout.log

# Log errori
tail -f /Library/Logs/activity-next-stderr.log
```

#### Gestione del servizio
```bash
# Fermare il servizio
sudo launchctl stop com.activity.next

# Scaricare il servizio (non si avvia più automaticamente)
sudo launchctl unload /Library/LaunchDaemons/com.activity.next.plist

# Ricaricare il servizio dopo modifiche al file plist
sudo launchctl unload /Library/LaunchDaemons/com.activity.next.plist
sudo launchctl load /Library/LaunchDaemons/com.activity.next.plist
```

### Accesso all'applicazione

Una volta avviato, il servizio sarà accessibile su:
```
http://localhost:3000
```

### Differenza tra LaunchDaemon e LaunchAgent

- **LaunchDaemon** (`/Library/LaunchDaemons/`): Si avvia all'avvio del sistema, disponibile per tutti gli utenti, gira come root
- **LaunchAgent** (`~/Library/LaunchAgents/`): Si avvia al login dell'utente, specifico per ogni utente

Questa configurazione usa LaunchDaemon per rendere l'applicazione disponibile a livello di sistema.