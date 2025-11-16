FROM node:18-slim

# Instalar procps para ps
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --legacy-peer-deps

# Copiar código fonte
COPY . .

EXPOSE 3000

# Adicionar logs para debug
RUN echo "Container started at $(date)" > /tmp/container_start.log

# Trap SIGTERM para debug
CMD ["sh", "-c", "trap 'echo SIGTERM received at $(date) >> /tmp/sigterm.log; ps aux >> /tmp/processes_at_sigterm.log; exit 0' TERM; echo 'Process started at $(date)' >> /tmp/process_start.log; npm start"]