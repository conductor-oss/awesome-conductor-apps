FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy source files
COPY index.ts ./
COPY workers/ ./workers/
COPY services/ ./services/
COPY database/ ./database/
COPY scripts/ ./scripts/
COPY tsconfig.json ./
COPY run.sh ./

# Build TypeScript
RUN yarn build

# Make run.sh executable
RUN chmod +x run.sh

# Set default environment variables
ENV ORKES_API_KEY_ID=""
ENV ORKES_API_KEY_SECRET=""
ENV ORKES_API_URL=""

# Use the run.sh script as entrypoint
ENTRYPOINT ["./run.sh"]
# Pass environment variables as default CMD arguments
CMD ["${ORKES_API_KEY_ID}", "${ORKES_API_KEY_SECRET}", "${ORKES_API_URL}"] 