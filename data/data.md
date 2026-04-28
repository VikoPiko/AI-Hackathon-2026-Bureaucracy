Privacy Policy
v1.0.5.1
API Reference
Agent Management

    API Reference
    Platform APIs
    Agent Management

Agents API Documentation

The Agents APIs provide comprehensive lifecycle management and execution capabilities for AI agents. These endpoints allow you to create, manage, and execute AI agents with synchronous and streaming execution modes.
Base URL & Authentication

All agent endpoints are relative to:

${SIRMA_AI_DOMAIN}/client/api/v1

All requests require your Project API Key in the X-API-Key header:

X-API-Key: YOUR_PROJECT_API_KEY

List Available Agents

Get a list of all agents available in your project with their metadata, capabilities, and parameters.
Endpoint

GET /agents

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response

{
  "success": true,
  "data": [
    {
      "id": "agent-abc123",
      "name": "Customer Support Bot",
      "description": "Handles user support queries",
      "capabilities": ["web_search", "knowledge_base", "memory"],
      "parameters": [],
      "category": null,
      "version": null,
      "status": "active",
      "isAvailable": true
    },
    {
      "id": "agent-xyz789",
      "name": "Data Analyst Agent",
      "description": "Performs data analysis and visualization",
      "capabilities": ["code_execution", "data_processing"],
      "parameters": [],
      "category": null,
      "version": null,
      "status": "active",
      "isAvailable": true
    }
  ],
  "message": "Agents retrieved successfully",
  "timestamp": "2025-10-28T10:15:00Z",
  "version": "v1"
}

Response Field Descriptions

    success (boolean) - Indicates if the request was successful
    data (array) - List of available agents
        id (string) - Agent identifier used for execution endpoints
        name (string) - Human-readable agent name
        description (string) - Agent description
        capabilities (array) - List of agent capabilities (tools, MCP servers, knowledge base, memory)
        parameters (array) - Parameter schemas (empty for agent instances)
        category (string, nullable) - Agent category
        version (string, nullable) - Agent version
        status (string) - Agent status (e.g., "active")
        isAvailable (boolean) - Whether the agent is available for execution
    message (string) - Human-readable description of the result
    timestamp (string) - ISO 8601 timestamp when the response was generated
    version (string) - API version used for the request

Response Codes

    200 OK - Agents retrieved successfully
    401 Unauthorized - Invalid API key
    429 Too Many Requests - Rate limit exceeded
    503 Service Unavailable - AI system unavailable

List Agent Options

Returns a lightweight list of all agents (including team members) with only their internal ID and display name. Useful for populating dropdowns and selectors without fetching full agent details.
Endpoint

GET /agents/options

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/options" \
  -H "X-API-Key: ${YOUR_API_KEY}"

Response

[
  {
    "id": 42,
    "name": "Dental Clinic Agent"
  },
  {
    "id": 57,
    "name": "Data Analyst Agent"
  }
]

Response Field Descriptions

    id (number) - Internal agent database ID
    name (string) - Agent display name (presetName)

Response Codes

    200 OK - Options retrieved successfully
    401 Unauthorized - Invalid API key
    429 Too Many Requests - Rate limit exceeded

Create a New Agent

Creates a new AI agent with the specified configuration including tools, knowledge base, memory settings, and other parameters.

Important: Before creating an agent, call the Get Configured LLM Providers endpoint to get valid provider IDs and model IDs.
Endpoint

POST /agents

Request Body

{
  "projectId": 110,
  "name": "Clara",
  "presetName": "Dental Clinic Agent",
  "description": "Handles tier-1 customer support queries with knowledge base access",
  "configuration": {
    "model": {
      "provider": 1,
      "modelName": "gemini-2.5-flash",
      "temperature": 0.7,
      "maxTokens": 5000,
      "frequencyPenalty": 0.0,
      "presencePenalty": 0.0,
      "topP": 1.0,
      "reasoningConfig": {},
      "failoverConfig": [
        {
          "provider": 3,
          "modelName": "claude-sonnet-4-6",
          "temperature": 0.7,
          "maxTokens": 6000
        },
        {
          "provider": 7,
          "modelName": "gpt-4o-mini",
          "temperature": 0.7,
          "maxTokens": 4000
        }
      ]
    },
    "instructions": "You are a helpful customer support assistant...",
    "addDatetimeToContext": true,
    "debugMode": false,
    "markdown": true,
    "maxIterations": 10,
    "maxRetries": 3,
    "monitoring": true,
    "parallelToolCalls": true,
    "reasoning": false,
    "showToolCalls": false,
    "timeoutSeconds": 60,
    "toolChoice": "auto",
    "tools": [
      {
        "toolId": "web-search-001",
        "toolName": "web_search",
        "category": "search",
        "enabled": true,
        "configuration": {},
        "requiredPermissions": ["search"]
      }
    ],
    "agenticRag": false,
    "knowledgeBase": [
      {
        "name": "Product Documentation",
        "description": "Company product documentation",
        "type": "native",
        "knowledgeBaseId": "550e8400-e29b-41d4-a716-446655440000",
        "searchType": "semantic",
        "maxResults": 5,
        "addReferences": true
      }
    ],
    "memory": {
      "enableAgenticMemory": true,
      "enableUserMemories": false,
      "enableSessionSummaries": true,
      "maxMemorySize": 1000,
      "memoryRetrievalLimit": 10,
      "retentionDays": 30
    },
    "sessionStorage": {
      "addHistoryToContext": true,
      "readChatHistory": true,
      "numHistoryRuns": 5
    },
    "structuredResponseConfig": {
      "structuredOutputs": false,
      "responseModel": null
    },
    "retryConfig": {
      "maxRetries": 3,
      "baseDelaySeconds": 1,
      "backoffMultiplier": 2,
      "maxDelaySeconds": 30,
      "enableJitter": true,
      "enableCircuitBreaker": false
    },
    "mcp": [
      {
        "mcpServerId": "660e8400-e29b-41d4-a716-446655440001",
        "mcpServerName": "custom_mcp_server",
        "enabledTools": ["tool1", "tool2"],
        "enabled": true
      }
    ]
  }
}

Request Field Descriptions

    projectId (number, required) - The project ID to create the agent in. Obtain from your project settings or the organization API.
    name (string, required) - The name the LLM knows the agent by (e.g., "Clara"). Sent to the AI service. (1-100 characters)
    presetName (string, required) - Display name shown in the platform dashboard (e.g., "Dental Clinic Agent"). (1-100 characters)
    description (string, optional) - Agent description
    configuration (object, required) - Agent configuration settings

Model Configuration (configuration.model)

    provider (number, required) - Provider configuration ID obtained from the Get Configured LLM Providers endpoint. This is the id field from that response (e.g., 1, 2, 3)
    modelName (string, required) - Model identifier obtained from the Get Configured LLM Providers endpoint. This is the availableModels[].id field from that response (e.g., "gemini-2.5-flash", "gpt-4o-mini", "claude-3-5-sonnet-20241022")
    temperature (number, optional) - Temperature parameter (0.0-2.0). Controls randomness in responses
    maxTokens (number, optional) - Maximum tokens in response
    frequencyPenalty (number, optional) - Frequency penalty parameter
    presencePenalty (number, optional) - Presence penalty parameter
    topP (number, optional) - Top-p sampling parameter
    reasoningConfig (object, optional) - Provider-specific reasoning configuration passed directly to the model (e.g., {"effort": "high"} for o-series models). Structure depends on the provider.
    failoverConfig (array, optional) - Ordered list of fallback model configurations used when the primary model is unavailable. Each entry contains:
        provider (number, required) - Provider configuration ID from the Get Configured LLM Providers endpoint
        modelName (string, required) - Model identifier from the provider's available models
        temperature (number, optional) - Temperature for this failover model (0.0-2.0)
        maxTokens (number, optional) - Maximum tokens for this failover model

Agent Behavior Settings

    instructions (string, optional) - System instructions/prompt for the agent
    addDatetimeToContext (boolean, optional) - Include current date/time in context
    debugMode (boolean, optional) - Enable debug mode for detailed logging
    markdown (boolean, optional) - Enable markdown formatting in responses
    maxIterations (number, optional) - Maximum iterations for agent reasoning loops
    maxRetries (number, optional) - Maximum retry attempts for failed operations
    monitoring (boolean, optional) - Enable monitoring and metrics collection
    parallelToolCalls (boolean, optional) - Allow parallel execution of tool calls
    reasoning (boolean, optional) - Enable chain-of-thought reasoning
    showToolCalls (boolean, optional) - Include tool calls in response output
    timeoutSeconds (number, optional) - Execution timeout in seconds
    toolChoice (string, optional) - Tool choice strategy ("auto", "required", "none")

Tools Configuration (configuration.tools)

Array of tool configurations. Each tool object contains:

    toolId (string, required) - Unique tool identifier
    toolName (string, required) - Tool name (e.g., "web_search", "code_execution")
    category (string, optional) - Tool category
    enabled (boolean, required) - Whether tool is enabled
    configuration (object, optional) - Tool-specific configuration parameters
    requiredPermissions (array, optional) - List of required permissions

Knowledge Base Configuration (configuration.knowledgeBase)

Array of knowledge base configurations. Each knowledge base object contains:

    name (string, optional) - Knowledge base display name
    description (string, optional) - Knowledge base description
    type (string, optional) - Knowledge base type (e.g., "native")
    knowledgeBaseId (string, required) - UUID referencing vector store ID
    searchType (string, optional) - Search type (e.g., "semantic", "keyword")
    maxResults (number, optional) - Maximum number of results to return
    addReferences (boolean, optional) - Include references in responses
    collectionName (string, optional) - Vector store collection name
    embeddingModel (string, optional) - Embedding model name
    chunkSize (number, optional) - Text chunk size for splitting
    chunkOverlap (number, optional) - Overlap between chunks
    referencesFormat (string, optional) - Format for references (e.g., "json")
    hydeRetrieval (boolean, optional) - Enable HyDE (Hypothetical Document Embeddings) retrieval. When enabled, the agent generates a hypothetical answer to the query and uses it to improve semantic search accuracy. Default: false

Agentic RAG Configuration

    agenticRag (boolean, optional) - Enable Agentic RAG (Retrieval-Augmented Generation) for dynamic knowledge retrieval and reasoning. Default: false

Structured Response Configuration (configuration.structuredResponseConfig)

    structuredOutputs (boolean, optional) - Enable structured output formatting
    responseModel (object, optional) - Response model schema for structured outputs

Memory Configuration (configuration.memory)

    enableAgenticMemory (boolean, optional) - Enable agent's long-term memory
    enableUserMemories (boolean, optional) - Enable user-specific memories
    enableSessionSummaries (boolean, optional) - Enable session summaries
    maxMemorySize (number, optional) - Maximum memory size
    memoryRetrievalLimit (number, optional) - Max memories to retrieve per request
    retentionDays (number, optional) - Memory retention period in days
    clearMemories (boolean, optional) - Clear existing memories
    deleteMemories (boolean, optional) - Delete memories on cleanup
    debugMode (boolean, optional) - Enable memory debug mode
    storageConfig (object, optional) - Storage configuration object

Session Storage Configuration (configuration.sessionStorage)

    addHistoryToContext (boolean, optional) - Include chat history in context
    readChatHistory (boolean, optional) - Read from chat history
    numHistoryRuns (number, optional) - Number of previous runs to include
    storageConfig (object, optional) - Storage configuration object

Retry Configuration (configuration.retryConfig)

    maxRetries (number, optional) - Maximum retry attempts
    baseDelaySeconds (number, optional) - Base delay between retries
    backoffMultiplier (number, optional) - Exponential backoff multiplier
    maxDelaySeconds (number, optional) - Maximum delay between retries
    enableJitter (boolean, optional) - Add randomness to retry delays
    jitterFactor (number, optional) - Jitter factor (0.0-1.0)
    retriableErrorTypes (array, optional) - List of retriable error types
    enableCircuitBreaker (boolean, optional) - Enable circuit breaker pattern
    circuitBreakerFailureThreshold (number, optional) - Failures before opening circuit
    circuitBreakerRecoveryTimeoutSeconds (number, optional) - Recovery timeout
    circuitBreakerSuccessThreshold (number, optional) - Successes to close circuit
    retryOnStatusCodes (array, optional) - HTTP status codes to retry
    retryOnExceptions (array, optional) - Exception types to retry

MCP Configuration (configuration.mcp)

Array of MCP (Model Context Protocol) server configurations. Each MCP object contains:

    mcpServerId (string, required) - UUID of the MCP server
    mcpServerName (string, required) - MCP server name
    enabledTools (array, optional) - List of enabled tool names for this MCP server
    enabled (boolean, required) - Whether this MCP server is enabled

HTTP Requests Configuration (configuration.httpRequests)

Array of HTTP request configurations. Each HTTP request object contains:

    httpRequestId (string, required) - UUID of the HTTP request
    httpRequestName (string, required) - HTTP request name
    enabled (boolean, required) - Whether this HTTP request is enabled

Metadata (configuration.metadata)

    metadata (object, optional) - Additional metadata including creation method and other tracking information

Agent Creator Flag (configuration.agentCreator)

    agentCreator (boolean, optional) - Whether this agent is an agent creator. Default: false

Example Request

curl -X POST "${SIRMA_AI_DOMAIN}/client/api/v1/agents" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 110,
    "name": "Clara",
    "presetName": "Dental Clinic Agent",
    "description": "Automates tier-1 customer support",
    "configuration": {
      "model": {
        "provider": 1,
        "modelName": "gemini-2.5-flash"
      },
      "instructions": "You are a helpful support assistant",
      "temperature": 0.7,
      "maxTokens": 2000,
      "tools": [
        {"toolName": "web_search", "enabled": true}
      ],
      "memory": {
        "enableAgenticMemory": true,
        "enableUserMemories": false
      }
    }
  }'

Response

{
  "success": true,
  "data": {
    "id": 94,
    "aiServiceAgentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
    "name": "Clara",
    "presetName": "Dental Clinic Agent",
    "description": "Contains KB from sirma.com, salexor.com investors.sirma.com",
    "organizationId": 22,
    "projectId": 110,
    "configuration": {
      "model": {
        "provider": 1,
        "modelName": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 5000,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0,
        "topP": 1.0
      },
      "instructions": "",
      "addDatetimeToContext": null,
      "debugMode": null,
      "markdown": null,
      "maxIterations": null,
      "maxRetries": null,
      "monitoring": null,
      "parallelToolCalls": null,
      "reasoning": null,
      "retryConfig": null,
      "retryDelaySeconds": null,
      "showToolCalls": null,
      "timeoutSeconds": null,
      "toolChoice": null,
      "tools": [],
      "mcp": [
        {
          "mcpServerId": "3544c49b-0ffb-47c3-9bd0-0d8bbeb89bdb",
          "mcpServerName": "eval",
          "enabledTools": [
            "get_staff_assignments",
            "export_staff_assignments_csv"
          ],
          "enabled": true
        }
      ],
      "httpRequests": [],
      "memory": {
        "clearMemories": false,
        "debugMode": false,
        "deleteMemories": false,
        "enableAgenticMemory": false,
        "enableSessionSummaries": false,
        "enableUserMemories": false,
        "maxMemorySize": 1000,
        "memoryRetrievalLimit": 10,
        "retentionDays": 30,
        "storageConfig": {}
      },
      "sessionStorage": {
        "addHistoryToContext": null,
        "readChatHistory": true,
        "numHistoryRuns": 15,
        "storageConfig": {}
      },
      "structuredResponseConfig": {
        "structuredOutputs": false,
        "responseModel": null
      },
      "agenticRag": false,
      "knowledgeBase": [],
      "metadata": null,
      "agentCreator": false
    },
    "created": "2025-10-27T08:10:56.388604186Z",
    "createdBy": "WLZYN971wZtqv8WY3QwygqBVTJpivntpZhHm6zUyhiURKLNxaZIfpu4TztHDwulL0p1iTCVG2MFsIVa78CP2pkohznA4W7vv2wxwDcE4RnQmOhJnOJbZwJhxH925SU50",
    "updated": "2025-10-27T08:10:56.389051446Z",
    "updatedBy": "WLZYN971wZtqv8WY3QwygqBVTJpivntpZhHm6zUyhiURKLNxaZIfpu4TztHDwulL0p1iTCVG2MFsIVa78CP2pkohznA4W7vv2wxwDcE4RnQmOhJnOJbZwJhxH925SU50",
    "status": null,
    "supportAttachments": true,
    "supportedAttachmentTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/pdf"
    ]
  },
  "message": "Agent created successfully",
  "timestamp": "2025-10-27T08:10:56.405590280Z",
  "version": "v1"
}

Response Field Descriptions

    success (boolean) - Indicates if the request was successful
    data (object) - Created agent data
        id (number) - Internal database agent ID
        aiServiceAgentId (string) - UUID used for API operations (use this for GET, PUT, DELETE, run endpoints)
        name (string) - The name the LLM knows the agent by (e.g., "Clara")
        presetName (string) - Display name shown in the platform dashboard (e.g., "Dental Clinic Agent")
        description (string) - Agent description
        organizationId (number) - Organization ID
        projectId (number) - Project ID
        configuration (object) - Complete agent configuration
        created (string) - ISO 8601 timestamp when agent was created
        createdBy (string) - User ID who created the agent
        updated (string) - ISO 8601 timestamp when agent was last updated
        updatedBy (string) - User ID who last updated the agent
        status (string, nullable) - Agent status
        supportAttachments (boolean) - Whether agent supports file attachments
        supportedAttachmentTypes (array of strings) - List of supported attachment MIME types (e.g., "image/jpeg", "application/pdf"). Empty array when supportAttachments is false
    message (string) - Human-readable description of the result
    timestamp (string) - ISO 8601 timestamp when the response was generated
    version (string) - API version used for the request

Response Codes

    201 Created - Agent created successfully
    400 Bad Request - Invalid request parameters
    401 Unauthorized - Invalid API key
    429 Too Many Requests - Rate limit exceeded
    503 Service Unavailable - AI system unavailable

Get Agent by ID

Retrieves detailed information about a specific agent including its complete configuration.

Important: Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
Endpoint

GET /agents/{aiServiceAgentId}

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response

{
  "success": true,
  "data": {
    "id": 94,
    "aiServiceAgentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
    "name": "Clara",
    "presetName": "Dental Clinic Agent",
    "description": "Contains KB from sirma.com, salexor.com investors.sirma.com",
    "organizationId": 22,
    "projectId": 110,
    "configuration": {
      "model": {
        "provider": 1,
        "modelName": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 5000,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0,
        "topP": 1.0
      },
      "instructions": "",
      "addDatetimeToContext": null,
      "debugMode": null,
      "markdown": null,
      "maxIterations": null,
      "maxRetries": null,
      "monitoring": null,
      "parallelToolCalls": null,
      "reasoning": null,
      "retryConfig": null,
      "retryDelaySeconds": null,
      "showToolCalls": null,
      "timeoutSeconds": null,
      "toolChoice": null,
      "tools": [],
      "mcp": [
        {
          "mcpServerId": "3544c49b-0ffb-47c3-9bd0-0d8bbeb89bdb",
          "mcpServerName": "eval",
          "enabledTools": [
            "get_staff_assignments",
            "export_staff_assignments_csv"
          ],
          "enabled": true
        }
      ],
      "httpRequests": [],
      "memory": {
        "clearMemories": false,
        "debugMode": false,
        "deleteMemories": false,
        "enableAgenticMemory": false,
        "enableSessionSummaries": false,
        "enableUserMemories": false,
        "maxMemorySize": 1000,
        "memoryRetrievalLimit": 10,
        "retentionDays": 30,
        "storageConfig": {}
      },
      "sessionStorage": {
        "addHistoryToContext": null,
        "readChatHistory": true,
        "numHistoryRuns": 15,
        "storageConfig": {}
      },
      "structuredResponseConfig": {
        "structuredOutputs": false,
        "responseModel": null
      },
      "agenticRag": false,
      "knowledgeBase": [],
      "metadata": null,
      "agentCreator": false
    },
    "created": "2025-10-27T08:10:56.388604Z",
    "createdBy": "WLZYN971wZtqv8WY3QwygqBVTJpivntpZhHm6zUyhiURKLNxaZIfpu4TztHDwulL0p1iTCVG2MFsIVa78CP2pkohznA4W7vv2wxwDcE4RnQmOhJnOJbZwJhxH925SU50",
    "updated": "2025-10-27T08:10:56.389051Z",
    "updatedBy": "WLZYN971wZtqv8WY3QwygqBVTJpivntpZhHm6zUyhiURKLNxaZIfpu4TztHDwulL0p1iTCVG2MFsIVa78CP2pkohznA4W7vv2wxwDcE4RnQmOhJnOJbZwJhxH925SU50",
    "status": null,
    "supportAttachments": true,
    "supportedAttachmentTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/pdf"
    ]
  },
  "message": "Agent retrieved successfully",
  "timestamp": "2025-10-27T08:10:57.473957692Z",
  "version": "v1"
}

Response Codes

    200 OK - Agent retrieved successfully
    401 Unauthorized - Invalid API key
    404 Not Found - Agent not found
    429 Too Many Requests - Rate limit exceeded

Update an Agent

Updates an existing agent's configuration, name, description, or any other settings.

Important:

    Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
    Before updating the model configuration, call the Get Configured LLM Providers endpoint to get valid provider IDs and model IDs.

Endpoint

PUT /agents/{aiServiceAgentId}

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Request Body

{
  "name": "Clara",
  "presetName": "Dental Clinic Agent v2",
  "description": "Contains KB from sirma.com, salexor.com investors.sirma.com",
  "configuration": {
    "model": {
      "provider": 1,
      "modelName": "gemini-2.5-flash",
      "temperature": 0.7,
      "maxTokens": 5000,
      "frequencyPenalty": 0,
      "presencePenalty": 0,
      "topP": 1
    },
    "instructions": "",
    "tools": [],
    "mcp": [
      {
        "mcpServerId": "3544c49b-0ffb-47c3-9bd0-0d8bbeb89bdb",
        "mcpServerName": "eval",
        "enabledTools": [
          "get_staff_assignments",
          "export_staff_assignments_csv"
        ],
        "enabled": true
      }
    ],
    "memory": {
      "clearMemories": false,
      "debugMode": false,
      "deleteMemories": false,
      "enableAgenticMemory": false,
      "enableSessionSummaries": false,
      "enableUserMemories": false,
      "maxMemorySize": 1000,
      "memoryRetrievalLimit": 10,
      "retentionDays": 30,
      "storageConfig": {}
    },
    "sessionStorage": {
      "addHistoryToContext": null,
      "readChatHistory": true,
      "numHistoryRuns": 15,
      "storageConfig": {}
    },
    "structuredResponseConfig": {
      "structuredOutputs": false,
      "responseModel": null
    },
    "agenticRag": false,
    "knowledgeBase": []
  }
}

Request Field Descriptions

    name (string, required) - The LLM-facing name of the agent (e.g., "Clara"). Sent to the AI service.
    presetName (string, optional) - Display name shown in the platform dashboard (e.g., "Dental Clinic Agent v2"). If omitted, keeps the existing preset name.
    description (string, optional) - Agent description
    configuration (object, required) - Agent configuration settings (same structure as Create Agent)

Example Request

curl -X PUT "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clara",
    "presetName": "Dental Clinic Agent v2",
    "description": "Contains KB from sirma.com, salexor.com investors.sirma.com",
    "configuration": {
      "model": {
        "provider": 1,
        "modelName": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 5000,
        "frequencyPenalty": 0,
        "presencePenalty": 0,
        "topP": 1
      },
      "instructions": "",
      "tools": [],
      "mcp": [],
      "memory": {
        "clearMemories": false,
        "debugMode": false,
        "deleteMemories": false,
        "enableAgenticMemory": false,
        "enableSessionSummaries": false,
        "enableUserMemories": false,
        "maxMemorySize": 1000,
        "memoryRetrievalLimit": 10,
        "retentionDays": 30,
        "storageConfig": {}
      },
      "sessionStorage": {
        "addHistoryToContext": null,
        "readChatHistory": true,
        "numHistoryRuns": 15,
        "storageConfig": {}
      },
      "structuredResponseConfig": {
        "structuredOutputs": false,
        "responseModel": null
      },
      "agenticRag": false,
      "knowledgeBase": []
    }
  }'

Response

{
  "success": true,
  "data": {
    "id": 94,
    "aiServiceAgentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
    "name": "Agent zZjP2 - updated",
    "description": "Contains KB from sirma.com, salexor.com investors.sirma.com",
    "organizationId": 22,
    "projectId": 110,
    "configuration": {
      "model": {
        "provider": 1,
        "modelName": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 5000,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0,
        "topP": 1.0
      },
      "instructions": "",
      "addDatetimeToContext": null,
      "debugMode": null,
      "markdown": null,
      "maxIterations": null,
      "maxRetries": null,
      "monitoring": null,
      "parallelToolCalls": null,
      "reasoning": null,
      "retryConfig": null,
      "retryDelaySeconds": null,
      "showToolCalls": null,
      "timeoutSeconds": null,
      "toolChoice": null,
      "tools": [],
      "mcp": [
        {
          "mcpServerId": "3544c49b-0ffb-47c3-9bd0-0d8bbeb89bdb",
          "mcpServerName": "eval",
          "enabledTools": [
            "get_staff_assignments",
            "export_staff_assignments_csv"
          ],
          "enabled": true
        }
      ],
      "httpRequests": [],
      "memory": {
        "clearMemories": false,
        "debugMode": false,
        "deleteMemories": false,
        "enableAgenticMemory": false,
        "enableSessionSummaries": false,
        "enableUserMemories": false,
        "maxMemorySize": 1000,
        "memoryRetrievalLimit": 10,
        "retentionDays": 30,
        "storageConfig": {}
      },
      "sessionStorage": {
        "addHistoryToContext": null,
        "readChatHistory": true,
        "numHistoryRuns": 15,
        "storageConfig": {}
      },
      "structuredResponseConfig": {
        "structuredOutputs": false,
        "responseModel": null
      },
      "agenticRag": false,
      "knowledgeBase": [],
      "metadata": null,
      "agentCreator": false
    },
    "created": "2025-10-27T08:10:56.388604Z",
    "createdBy": "WLZYN971wZtqv8WY3QwygqBVTJpivntpZhHm6zUyhiURKLNxaZIfpu4TztHDwulL0p1iTCVG2MFsIVa78CP2pkohznA4W7vv2wxwDcE4RnQmOhJnOJbZwJhxH925SU50",
    "updated": "2025-10-27T08:10:57.904036282Z",
    "updatedBy": "WLZYN971wZtqv8WY3QwygqBVTJpivntpZhHm6zUyhiURKLNxaZIfpu4TztHDwulL0p1iTCVG2MFsIVa78CP2pkohznA4W7vv2wxwDcE4RnQmOhJnOJbZwJhxH925SU50",
    "status": null,
    "supportAttachments": true,
    "supportedAttachmentTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/pdf"
    ]
  },
  "message": "Agent updated successfully",
  "timestamp": "2025-10-27T08:10:57.910948075Z",
  "version": "v1"
}

Response Codes

    200 OK - Agent updated successfully
    400 Bad Request - Invalid request parameters
    401 Unauthorized - Invalid API key
    404 Not Found - Agent not found
    429 Too Many Requests - Rate limit exceeded
    503 Service Unavailable - AI system unavailable

Delete an Agent

Permanently deletes an existing agent. This action cannot be undone.

Important: Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
Endpoint

DELETE /agents/{aiServiceAgentId}

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Example Request

curl -X DELETE "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2" \
  -H "X-API-Key: ${YOUR_API_KEY}"

Response

HTTP/1.1 204 No Content

Response Codes

    204 No Content - Agent deleted successfully
    401 Unauthorized - Invalid API key
    404 Not Found - Agent not found
    429 Too Many Requests - Rate limit exceeded

Clone an Agent

Creates an exact copy of an existing agent with a new name, inheriting all configuration, tools, knowledge base, memory settings, and other parameters from the source agent.

Important: Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
Endpoint

POST /agents/{aiServiceAgentId}/clone

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier of the agent to clone (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Request Body

{
  "name": "Clara",
  "presetName": "Dental Clinic Agent (Copy)"
}

Request Field Descriptions

    name (string, required) - The LLM-facing name for the cloned agent (1-100 characters)
    presetName (string, optional) - Display name for the cloned agent shown in the platform dashboard. If omitted, defaults to name. (1-100 characters)

Example Request

curl -X POST "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2/clone" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Clara",
    "presetName": "Dental Clinic Agent (Copy)"
  }'

Response

{
  "success": true,
  "data": {
    "id": 95,
    "aiServiceAgentId": "6a1d9035-bf6d-4e1b-b825-8c482c234ef3",
    "name": "Clara",
    "presetName": "Dental Clinic Agent (Copy)",
    "description": "Handles tier-1 customer support queries with knowledge base access",
    "organizationId": 22,
    "projectId": 110,
    "configuration": {
      "model": {
        "provider": 1,
        "modelName": "gemini-2.5-flash",
        "temperature": 0.7,
        "maxTokens": 5000,
        "frequencyPenalty": 0.0,
        "presencePenalty": 0.0,
        "topP": 1.0
      },
      "instructions": "You are a helpful customer support assistant...",
      "tools": [],
      "mcp": [],
      "memory": {
        "enableAgenticMemory": true,
        "enableUserMemories": false,
        "enableSessionSummaries": true,
        "maxMemorySize": 1000,
        "memoryRetrievalLimit": 10,
        "retentionDays": 30
      },
      "agenticRag": false,
      "knowledgeBase": [],
      "metadata": {
        "creation_method": "CLONE"
      },
      "agentCreator": false
    },
    "created": "2025-10-28T11:00:00.000000000Z",
    "createdBy": "YOUR_API_KEY_HASH",
    "updated": "2025-10-28T11:00:00.000000000Z",
    "updatedBy": "YOUR_API_KEY_HASH",
    "status": null,
    "supportAttachments": true,
    "supportedAttachmentTypes": [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "text/plain",
      "application/pdf"
    ]
  },
  "message": "Agent cloned successfully",
  "timestamp": "2025-10-28T11:00:00.123456789Z",
  "version": "v1"
}

Response Field Descriptions

Same as Create a New Agent response. The cloned agent receives a new aiServiceAgentId and new created/updated timestamps. The configuration.metadata will contain "creation_method": "CLONE" to indicate the agent's origin.
Response Codes

    201 Created - Agent cloned successfully
    400 Bad Request - Invalid request parameters (e.g., name too long or blank)
    401 Unauthorized - Invalid API key
    404 Not Found - Source agent not found
    429 Too Many Requests - Rate limit exceeded
    503 Service Unavailable - AI system unavailable

Get Configured LLM Providers

Retrieves all LLM provider configurations available for agents in your organization, including their available models. This endpoint should be called before creating or updating agents to get valid provider IDs and model IDs.
Endpoint

GET /agents/llm-providers

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/llm-providers" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response

[
  {
    "id": 1,
    "providerId": "google",
    "providerName": "Google AI",
    "name": "Google Gemini Provider",
    "availableModels": [
      {
        "id": "gemini-2.5-flash",
        "name": "Gemini 2.5 Flash",
        "description": "Fast and efficient model for everyday tasks",
        "contextLength": 1000000,
        "maxOutputTokens": 8192,
        "fixedTemperature": null,
        "pricing": {
          "input": 0.075,
          "output": 0.30
        }
      },
      {
        "id": "gemini-2.0-flash-exp",
        "name": "Gemini 2.0 Flash Experimental",
        "description": "Latest experimental flash model",
        "contextLength": 1000000,
        "maxOutputTokens": 8192,
        "fixedTemperature": null,
        "pricing": {
          "input": 0.0,
          "output": 0.0
        }
      }
    ],
    "validationStatus": "VALID",
    "lastValidatedAt": "2025-10-28T10:15:00Z",
    "validationError": null
  },
  {
    "id": 2,
    "providerId": "openai",
    "providerName": "OpenAI",
    "name": "OpenAI GPT Provider",
    "availableModels": [
      {
        "id": "gpt-4o",
        "name": "GPT-4 Optimized",
        "description": "Most capable GPT-4 model",
        "contextLength": 128000,
        "maxOutputTokens": 16384,
        "fixedTemperature": null,
        "pricing": {
          "input": 2.50,
          "output": 10.00
        }
      },
      {
        "id": "gpt-4o-mini",
        "name": "GPT-4 Optimized Mini",
        "description": "Efficient and cost-effective GPT-4 model",
        "contextLength": 128000,
        "maxOutputTokens": 16384,
        "fixedTemperature": null,
        "pricing": {
          "input": 0.150,
          "output": 0.600
        }
      }
    ],
    "validationStatus": "VALID",
    "lastValidatedAt": "2025-10-28T10:14:00Z",
    "validationError": null
  },
  {
    "id": 3,
    "providerId": "anthropic",
    "providerName": "Anthropic",
    "name": "Anthropic Claude Provider",
    "availableModels": [
      {
        "id": "claude-3-5-sonnet-20241022",
        "name": "Claude 3.5 Sonnet",
        "description": "Most intelligent Claude model",
        "contextLength": 200000,
        "maxOutputTokens": 8192,
        "fixedTemperature": null,
        "pricing": {
          "input": 3.00,
          "output": 15.00
        }
      }
    ],
    "validationStatus": "VALID",
    "lastValidatedAt": "2025-10-28T10:13:00Z",
    "validationError": null
  }
]

Response Field Descriptions

    id (number) - Provider configuration ID (use this value for model.provider when creating/updating agents)
    providerId (string) - Provider identifier (e.g., "google", "openai", "anthropic")
    providerName (string) - Human-readable provider name
    name (string) - Custom name for this provider configuration
    availableModels (array) - List of models available for this provider
        id (string) - Model identifier (use this value for model.modelName when creating/updating agents)
        name (string) - Human-readable model name
        description (string, nullable) - Model description
        contextLength (number, nullable) - Maximum context window size in tokens
        maxOutputTokens (number, nullable) - Maximum output tokens the model can generate
        fixedTemperature (number, nullable) - Fixed temperature value if model doesn't support custom temperature
        pricing (object, nullable) - Pricing information per million tokens
            input (number) - Cost per million input tokens in USD
            output (number) - Cost per million output tokens in USD
    validationStatus (string) - Provider validation status ("VALID", "INVALID", "PENDING")
    lastValidatedAt (string, nullable) - ISO 8601 timestamp of last validation
    validationError (string, nullable) - Error message if validation failed

Response Codes

    200 OK - Providers retrieved successfully
    401 Unauthorized - Invalid API key
    429 Too Many Requests - Rate limit exceeded
    503 Service Unavailable - AI system unavailable

Usage Notes

    Call this endpoint first before creating or updating agents to get valid provider and model IDs
    The id field is what you use for model.provider in agent configurations
    The availableModels[].id field is what you use for model.modelName in agent configurations
    Only models that are enabled and configured for your organization will appear in the response
    Providers with validationStatus other than "VALID" may not work properly
    Pricing information can be used to estimate costs before creating agents
    Model capabilities (context length, max output tokens) help you choose the right model for your use case

Execute Agent Synchronously

Executes the specified agent with given parameters and returns the complete result immediately. Best for tasks that complete in under 30 seconds.

Important: Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
Endpoint

POST /agents/{aiServiceAgentId}/run

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Request Body (Multipart Form Data Only)

This endpoint only accepts multipart/form-data content type.

Required Parameters:

    message (string) - The message/prompt to send to the agent

Optional Parameters:

    tag (string) - Tag to label this run for filtering and analytics (alphanumeric, hyphens, underscores, max 50 chars)
    user_id (string) - User identifier for tracking. If not provided, the system generates one automatically
    session_id (string) - Session identifier for conversation tracking. Important: The session_id is generated by the platform and returned in the response on the first request. For subsequent requests in the same conversation, include this session_id in the payload to maintain conversation context and history
    tool_context (string) - JSON string providing additional context to agent tools (e.g., {"key": "value"})
    include_messages (boolean) - Include full message history in response (default: false). Set to true to include detailed conversation steps and tool calls
    audio (file[]) - Array of audio files to upload
    images (file[]) - Array of image files to upload
    videos (file[]) - Array of video files to upload
    files (file[]) - Array of document files to upload

File Upload Limits:

Limits are configured per organization. The defaults are:

    Maximum file size per file: 10MB
    Maximum total request size: 50MB (all files combined)
    Maximum number of files per request: 20 files

To retrieve the actual limits for your organization, call GET /client/api/v1/organizations/limits.
Example Request

curl -X POST "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2/run" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -F "message=Analyze this document and provide a summary" \
  -F "user_id=user-abc123" \
  -F "session_id=session-xyz789" \
  -F "tag=document-analysis" \
  -F "files=@document.pdf" \
  -F "images=@chart.png"

Response

{
  "success": true,
  "data": {
    "run_id": "run-abc123",
    "content": "Based on the document analysis, here are the key findings: The report covers Q3 2024 performance metrics showing 23% growth in revenue...",
    "session_id": "session-xyz789",
    "user_id": "user-abc123",
    "metrics": {
      "inputTokens": 850,
      "outputTokens": 400,
      "totalTokens": 1250,
      "duration": 2.45
    },
    "messages": null
  },
  "message": "Agent executed successfully",
  "timestamp": "2025-10-28T14:30:00Z",
  "version": "v1"
}

Note: The messages field is null by default. Set include_messages=true in the request to receive the full message history including conversation steps and tool calls.
Response Field Descriptions

    success (boolean) - Indicates if the execution was successful
    data (object) - Execution result
        run_id (string) - Unique identifier for this execution run
        content (string | object | array) - The agent's response content (may be a plain string, a structured object, or an array depending on the agent configuration)
        session_id (string) - Session identifier for the conversation
        user_id (string) - User identifier (generated by system if not provided in request)
        metrics (object, optional) - Execution metrics
            inputTokens (number) - Input tokens consumed
            outputTokens (number) - Output tokens generated
            totalTokens (number) - Total tokens used
            duration (number) - Execution time in seconds
        messages (array, nullable) - Full message history including conversation steps and tool calls (only included when include_messages=true)
    message (string) - Human-readable description of the result
    timestamp (string) - ISO 8601 timestamp when the response was generated
    version (string) - API version used for the request

Response Codes

    200 OK - Agent executed successfully
    400 Bad Request - Invalid parameters or agent not found
    401 Unauthorized - Invalid API key
    413 Payload Too Large - File size exceeds limits
    429 Too Many Requests - Rate limit exceeded
    500 Internal Server Error - Agent execution failed
    503 Service Unavailable - AI system unavailable

Execute Agent with Streaming

Executes the specified agent with streaming response for real-time output using Server-Sent Events (SSE). Perfect for interactive applications, chatbots, and long-running tasks where you want to see incremental progress.

Important: Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
Endpoint

POST /agents/{aiServiceAgentId}/run-stream

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Request Body (Multipart Form Data Only)

This endpoint only accepts multipart/form-data content type.

Required Parameters:

    message (string) - The message/prompt to send to the agent

Optional Parameters:

    tag (string) - Tag to label this run for filtering and analytics (alphanumeric, hyphens, underscores, max 50 chars)
    user_id (string) - User identifier for tracking. If not provided, the system generates one automatically
    session_id (string) - Session identifier for conversation tracking. Important: The session_id is generated by the platform and returned in the response on the first request. For subsequent requests in the same conversation, include this session_id in the payload to maintain conversation context and history
    tool_context (string) - JSON string providing additional context to agent tools (e.g., {"key": "value"})
    audio (file[]) - Array of audio files to upload
    images (file[]) - Array of image files to upload
    videos (file[]) - Array of video files to upload
    files (file[]) - Array of document files to upload

File Upload Limits:

Limits are configured per organization. The defaults are:

    Maximum file size per file: 10MB
    Maximum total request size: 50MB (all files combined)
    Maximum number of files per request: 20 files

To retrieve the actual limits for your organization, call GET /client/api/v1/organizations/limits.
Example Request

curl -X POST "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2/run-stream" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Accept: text/event-stream" \
  -F "message=Generate a detailed analysis report" \
  -F "user_id=user-abc123" \
  -F "session_id=session-xyz789" \
  -F "tag=report-generation" \
  --no-buffer

    Note: The --no-buffer flag in curl disables buffering so you can see the streaming response in real-time as events arrive.

How SSE Streaming Works

Important: Server-Sent Events (SSE) do not require a separate connection setup. When you make the POST request to /run-stream, the server:

    Accepts your request and immediately begins processing
    Returns a response with Content-Type: text/event-stream
    Keeps the HTTP connection open
    Streams events back to you as they're generated
    Closes the connection when the agent execution completes

The POST request itself establishes the SSE connection - there is no separate handshake or connection endpoint.
Connection Management Best Practices

    Error Handling: Always implement error handlers for network failures
    Timeouts: Set reasonable timeouts (server timeout is typically 60 seconds)
    Reconnection: Implement exponential backoff for reconnection attempts on failure
    Connection Cleanup: Close connections properly when done or on errors
    Buffering: Parse SSE events line-by-line to handle incomplete chunks

Streaming Response

The response is sent as Server-Sent Events (SSE). The exact event structure depends on the agent's execution.

Example SSE Response Stream:

data: {"type":"start","session_id":"session-xyz789","user_id":"user-abc123"}

data: {"type":"content","text":"Analyzing","session_id":"session-xyz789","user_id":"user-abc123"}

data: {"type":"content","text":" the provided","session_id":"session-xyz789","user_id":"user-abc123"}

data: {"type":"content","text":" document...","session_id":"session-xyz789","user_id":"user-abc123"}

data: {"type":"content","text":" Based on","session_id":"session-xyz789","user_id":"user-abc123"}

data: {"type":"content","text":" the findings","session_id":"session-xyz789","user_id":"user-abc123"}

data: {"type":"complete","metrics":{"input_tokens":850,"output_tokens":650,"total_tokens":1500,"time":3.5},"session_id":"session-xyz789","user_id":"user-abc123"}

Response Field Descriptions

Each SSE event contains JSON data with:

    type (string) - Event type ("start", "content", "complete", "error")
    text (string, optional) - Incremental response content (present in "content" events)
    session_id (string) - Session identifier for the conversation
    user_id (string) - User identifier (generated by system if not provided in request)
    metrics (object, optional) - Execution metrics (present in "complete" event)
        input_tokens (number) - Input tokens used
        output_tokens (number) - Output tokens generated
        total_tokens (number) - Total tokens used
        time (number) - Execution time in seconds

Response Codes

    200 OK - Streaming execution started
    400 Bad Request - Invalid parameters
    401 Unauthorized - Invalid API key
    404 Not Found - Agent not found
    413 Payload Too Large - File size exceeds limits
    500 Internal Server Error - Agent execution failed during streaming
    503 Service Unavailable - AI system unavailable

Execute Agent Asynchronously

Starts asynchronous execution of the specified agent using background processing and returns a job ID for status polling. Best for long-running tasks (>30 seconds), background processing, or when you don't need immediate results.

The request is submitted with background=true, which means the job is queued immediately and execution happens in the background. Use the returned jobId to poll the Get Agent Job Status endpoint until the job reaches a terminal state (COMPLETED, FAILED, or TIMEOUT).

Important: Use the aiServiceAgentId (UUID) from the create/list response, not the internal id number.
Endpoint

POST /agents/{aiServiceAgentId}/run-async

Path Parameters

    aiServiceAgentId (required) - The agent UUID identifier (e.g., "579c7824-af5c-4fca-ad74-7a371b123df2")

Request Body (Multipart Form Data Only)

This endpoint only accepts multipart/form-data content type.

Required Parameters:

    message (string) - The message/prompt to send to the agent

Optional Parameters:

    tag (string) - Tag to label this run for filtering and analytics (alphanumeric, hyphens, underscores, max 50 chars)
    user_id (string) - User identifier for tracking. If not provided, the system generates one automatically
    session_id (string) - Session identifier for conversation tracking. Important: The session_id is generated by the platform and returned in the response on the first request. For subsequent requests in the same conversation, include this session_id in the payload to maintain conversation context and history
    tool_context (string) - JSON string providing additional context to agent tools (e.g., {"key": "value"})
    audio (file[]) - Array of audio files to upload
    images (file[]) - Array of image files to upload
    videos (file[]) - Array of video files to upload
    files (file[]) - Array of document files to upload

File Upload Limits:

Limits are configured per organization. The defaults are:

    Maximum file size per file: 10MB
    Maximum total request size: 50MB (all files combined)
    Maximum number of files per request: 20 files

To retrieve the actual limits for your organization, call GET /client/api/v1/organizations/limits.
Example Request

curl -X POST "${SIRMA_AI_DOMAIN}/client/api/v1/agents/579c7824-af5c-4fca-ad74-7a371b123df2/run-async" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -F "message=Perform comprehensive analysis on this large dataset" \
  -F "user_id=user-abc123" \
  -F "session_id=session-xyz789" \
  -F "tag=data-analysis" \
  -F "files=@large-dataset.csv" \
  -F "files=@supplementary-data.xlsx"

Response

{
  "jobId": "job-550e8400-e29b-41d4-a716-446655440000",
  "agentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
  "status": "PENDING",
  "userId": "user-abc123",
  "sessionId": "session-xyz789",
  "message": "Job created successfully"
}

Response Field Descriptions

    jobId (string) - Unique job identifier for tracking execution status
    agentId (string) - Agent UUID that is executing the job
    status (string) - Initial job status (always "PENDING" when created)
    userId (string) - User identifier for this job (generated by system if not provided in request)
    sessionId (string) - Session identifier for conversation continuity
    message (string) - Confirmation message

Response Codes

    202 Accepted - Agent execution started (job created successfully)
    400 Bad Request - Invalid parameters or agent not found
    401 Unauthorized - Invalid API key
    413 Payload Too Large - File size exceeds limits
    429 Too Many Requests - Rate limit exceeded
    503 Service Unavailable - AI system unavailable

Workflow

    Submit job - POST to /run-async returns immediately with jobId
    Poll status - Use jobId with GET /jobs/{jobId}/status to check progress
    Retrieve results - When status is "COMPLETED", results are included in status response

Get Agent Job Status

Returns the status, progress, and results of an asynchronous agent execution job. Poll this endpoint to track job execution.
Endpoint

GET /agents/jobs/{jobId}/status?include_messages={boolean}

Path Parameters

    jobId (required) - The job identifier returned from /run-async (e.g., "job-550e8400-e29b-41d4-a716-446655440000")

Query Parameters

    include_messages (optional, boolean) - Include full message history in response (default: false). Set to true to include detailed conversation steps and tool calls in the job result

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/jobs/job-550e8400-e29b-41d4-a716-446655440000/status?include_messages=false" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response - Job Pending

{
  "jobId": "job-550e8400-e29b-41d4-a716-446655440000",
  "agentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
  "status": "PENDING",
  "userId": "user-abc123",
  "sessionId": "session-xyz789",
  "result": null,
  "error": null,
  "startedAt": null,
  "completedAt": null
}

Response - Job Running

{
  "jobId": "job-550e8400-e29b-41d4-a716-446655440000",
  "agentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
  "status": "RUNNING",
  "userId": "user-abc123",
  "sessionId": "session-xyz789",
  "result": null,
  "error": null,
  "startedAt": "2025-10-28T14:25:10Z",
  "completedAt": null
}

Response - Job Completed

{
  "jobId": "job-550e8400-e29b-41d4-a716-446655440000",
  "agentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
  "status": "COMPLETED",
  "userId": "user-abc123",
  "sessionId": "session-xyz789",
  "result": {
    "runId": "run-abc123",
    "content": "Analysis complete. Key findings: The dataset shows strong correlation between variables A and B with p-value < 0.001...",
    "sessionId": "session-xyz789",
    "userId": "user-abc123",
    "metrics": {
      "inputTokens": 15000,
      "outputTokens": 5000,
      "totalTokens": 20000,
      "duration": 45.5
    },
    "messages": null
  },
  "error": null,
  "startedAt": "2025-10-28T14:25:10Z",
  "completedAt": "2025-10-28T14:26:55Z"
}

Note: The messages field in the result is null by default. Set includeMessages=true in the query parameter to receive the full message history.
Response - Job Failed

{
  "jobId": "job-550e8400-e29b-41d4-a716-446655440000",
  "agentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
  "status": "FAILED",
  "userId": "user-abc123",
  "sessionId": "session-xyz789",
  "result": null,
  "error": "Agent execution failed: LLM provider rate limit exceeded",
  "startedAt": "2025-10-28T14:25:10Z",
  "completedAt": "2025-10-28T14:25:45Z"
}

Response - Job Timeout

{
  "jobId": "job-550e8400-e29b-41d4-a716-446655440000",
  "agentId": "579c7824-af5c-4fca-ad74-7a371b123df2",
  "status": "TIMEOUT",
  "userId": "user-abc123",
  "sessionId": "session-xyz789",
  "result": null,
  "error": "Job execution timed out",
  "startedAt": "2025-10-28T14:25:10Z",
  "completedAt": "2025-10-28T15:00:00Z"
}

Response Field Descriptions

    jobId (string) - Unique job identifier
    agentId (string) - Agent UUID executing the job
    status (string) - Current job status (see Job Status Values below)
    userId (string, nullable) - User identifier for this job (generated by system if not provided in request)
    sessionId (string, nullable) - Session identifier for conversation continuity
    result (object, nullable) - Execution results (present when status is "COMPLETED")
        runId (string) - Execution run identifier
        content (string | object | array) - Agent's response content (may be a plain string, a structured object, or an array depending on the agent configuration)
        sessionId (string) - Session identifier for the conversation
        userId (string) - User identifier
        metrics (object, nullable) - Execution metrics
            inputTokens (number) - Input tokens consumed
            outputTokens (number) - Output tokens generated
            totalTokens (number) - Total tokens used
            duration (number) - Execution time in seconds
        messages (array, nullable) - Full message history including conversation steps and tool calls (only included when includeMessages=true)
    error (string, nullable) - Error message (present when status is "FAILED" or "TIMEOUT")
    startedAt (string, nullable) - ISO 8601 timestamp when job started execution
    completedAt (string, nullable) - ISO 8601 timestamp when job finished

Job Status Values
Status	Description
PENDING	Job is queued and waiting to start
RUNNING	Job is currently executing
COMPLETED	Job finished successfully, results available
FAILED	Job failed with error
TIMEOUT	Job execution exceeded timeout limit
CANCELLED	Job was cancelled (future feature)
Response Codes

    200 OK - Job status retrieved successfully
    401 Unauthorized - Invalid API key
    404 Not Found - Job not found
    429 Too Many Requests - Rate limit exceeded

Polling Best Practices

    Exponential Backoff: Start with short intervals (1-2 seconds), increase gradually
    Max Poll Duration: Set a maximum polling duration to avoid infinite loops
    Stop on Terminal Status: Stop polling when status is COMPLETED, FAILED, or TIMEOUT
    Respect Rate Limits: Monitor rate limit headers and adjust polling frequency

Example Polling Logic:

# Poll every 2 seconds for up to 5 minutes
for i in {1..150}; do
  response=$(curl -s -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/jobs/${JOB_ID}/status" \
    -H "X-API-Key: ${YOUR_API_KEY}")

  status=$(echo $response | jq -r '.status')

  if [ "$status" = "COMPLETED" ] || [ "$status" = "FAILED" ] || [ "$status" = "TIMEOUT" ]; then
    echo "Job finished with status: $status"
    echo $response | jq '.'
    break
  fi

  echo "Status: $status - waiting..."
  sleep 2
done

Error Handling
Common Error Responses
Agent Not Found

{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent 'agent-invalid-123' not found"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Invalid Agent Parameters

{
  "success": false,
  "error": {
    "code": "AGENT_INVALID_PARAMETERS",
    "message": "Invalid agent configuration: temperature must be between 0 and 1"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Missing Required Parameters

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Missing required parameter: message must not be null or empty"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

File Too Large

{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit of 10MB",
    "details": "File size: 15.89MB, Maximum allowed: 10MB"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Agent Execution Failure

{
  "success": false,
  "error": {
    "code": "AGENT_EXECUTION_FAILURE",
    "message": "Agent execution failed: timeout waiting for response"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

MCP Server Not Found

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "MCP server not found: 660e8400-e29b-41d4-a716-446655440001"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

MCP Server Deleted

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "MCP server 660e8400-e29b-41d4-a716-446655440001 has been deleted"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Invalid Provider Configuration

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid provider ID: Provider configuration not found or not available"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Invalid Model for Provider

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Model 'gpt-4o' is not available for the selected provider"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Use Cases
Synchronous Execution (/run)

    Quick Queries: Simple questions requiring immediate responses
    API Integrations: Backend services needing complete results
    Batch Processing: Processing multiple items where final result is needed
    Short Tasks: Tasks completing in under 30 seconds
    Synchronous Workflows: Applications requiring blocking execution

Streaming Execution (/run-stream)

    Chatbot Interfaces: Real-time conversational AI applications
    Interactive Applications: Apps showing incremental progress
    Content Generation: Blog posts, articles, reports with live updates
    Long-Form Responses: Responses requiring more than 30 seconds
    User Engagement: Applications where partial results improve UX

Asynchronous Execution (/run-async)

    Long-Running Tasks: Processing that takes minutes or hours
    Background Jobs: Tasks that don't require immediate user attention
    Heavy Computation: Complex analysis, large dataset processing
    Scheduled Operations: Batch processing, scheduled reports
    Resource-Intensive Tasks: Tasks requiring significant compute resources
    Webhook Integration: Fire-and-forget operations with callback notifications
    Queue-Based Systems: Integration with job queue architectures

Rate Limiting

Agent execution endpoints are subject to rate limiting. Monitor these headers:

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60

Rate Limit Best Practices

    Use streaming execution for real-time feedback on long-running tasks
    Implement exponential backoff for 429 errors
    Monitor rate limit headers in responses
    Consider upgrading limits for high-volume usage
    Cache agent responses when appropriate

Best Practices
Choosing the Right Execution Mode

    Use /run when:
        You need immediate results
        Task completes in under 30 seconds
        You're building synchronous APIs
        You need simple request-response pattern

    Use /run-stream when:
        Building real-time chat interfaces
        User needs to see progress
        Generating long-form content
        Improving perceived performance

    Use /run-async when:
        Task takes more than 30 seconds
        Building background job systems
        Processing can happen without user waiting
        Implementing webhook-based workflows
        Handling resource-intensive operations
        Need to avoid HTTP timeouts on long tasks

File Upload Best Practices

    Validate file types and sizes on client side before upload
    Use appropriate file types (images for vision tasks, documents for analysis)
    Compress large files when possible
    Consider splitting large batches across multiple requests
    Handle upload errors gracefully with retry logic

Session Management

    Use session_id to maintain conversation context
    Store session_id on client side for continuity
    Pass same session_id across multiple requests for context-aware responses
    Use different session_id for different conversation threads

Error Handling

    Always implement comprehensive error handling
    Check success field in responses
    Parse error codes for specific handling logic
    Implement retry logic with exponential backoff
    Log errors for debugging and monitoring

Agent Identifier Usage

    Always use aiServiceAgentId (UUID) for GET, PUT, DELETE, and run endpoints
    The internal id (number) is for database reference only and should not be used in API calls
    Store aiServiceAgentId when creating agents for future operations

Provider and Model Configuration

    Always call the Get Configured LLM Providers endpoint before creating or updating agents
    Use the id field from the providers response for model.provider in agent configuration
    Use the availableModels[].id field for model.modelName in agent configuration
    Verify that the selected provider has validationStatus as "VALID" before using it
    Ensure the selected model is available in the provider's availableModels list
    Store provider and model IDs for reuse, but periodically refresh them as configurations may change

MCP Server Configuration

    Ensure MCP servers are active and not deleted before adding to agent configuration
    Validate MCP server IDs are valid UUIDs
    Verify MCP servers belong to the same organization and project
    Handle MCP server validation errors appropriately

Knowledge Base Configuration

    Validate knowledge base IDs are valid UUIDs
    Ensure knowledge bases are not deleted before adding to agent
    Verify knowledge bases belong to the same organization and project
    Configure appropriate search types and result limits for your use case

On this page
Previous
Audio Agent Management
Next
Agent Session Management


V

Privacy Policy
v1.0.5.1
API Reference
Agent Session Management

    API Reference
    Platform APIs
    Agent Session Management

Agent Sessions API Documentation

The Agent Sessions APIs provide comprehensive session management capabilities for AI agents. These endpoints allow you to list, retrieve, delete, and manage sessions and their execution history (runs) for your agents.
Base URL & Authentication

All agent session endpoints are relative to:

${SIRMA_AI_DOMAIN}/client/api/v1

All requests require your Project API Key in the X-API-Key header:

X-API-Key: YOUR_PROJECT_API_KEY

List Agent Sessions

Get a paginated list of all sessions for a specific agent with optional filtering by session name.
Endpoint

GET /agents/{agentId}/sessions

Path Parameters

    agentId (required) - The agent identifier (e.g., "agent-abc123")

Query Parameters

    user_id (string, required) - User ID for tracking
    sessionName (string, optional) - Filter sessions by name
    limit (integer, optional, default: 20) - Number of results per page
    page (integer, optional, default: 1) - Page number (1-based)
    sortBy (string, optional, default: "created_at") - Sort field
    sortOrder (string, optional, default: "DESC") - Sort order ("ASC" or "DESC")
    dbId (string, optional) - Optional database ID for multi-tenant scenarios

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/agent-abc123/sessions?user_id=user-12345&limit=20&page=1&sortOrder=DESC" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response

{
  "success": true,
  "data": [
    {
      "sessionId": "session-xyz789",
      "sessionName": "Customer Support Chat",
      "sessionState": {
        "lastMessage": "How can I help you?",
        "messageCount": 5
      },
      "createdAt": "2025-10-27T10:15:30",
      "updatedAt": "2025-10-27T10:20:45"
    },
    {
      "sessionId": "session-abc456",
      "sessionName": "Product Inquiry",
      "sessionState": {
        "lastMessage": "Tell me about your pricing",
        "messageCount": 3
      },
      "createdAt": "2025-10-26T14:30:00",
      "updatedAt": "2025-10-26T14:35:20"
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "message": "Sessions retrieved successfully",
  "timestamp": "2025-10-28T10:15:00Z",
  "version": "v1"
}

Response Field Descriptions

    success (boolean) - Indicates if the request was successful
    data (array) - List of session objects
        sessionId (string) - Unique session identifier
        sessionName (string) - Human-readable session name
        sessionState (object) - Session state data
        createdAt (string) - ISO 8601 timestamp when session was created
        updatedAt (string) - ISO 8601 timestamp when session was last updated
    pagination (object) - Pagination information
        page (integer) - Current page number (0-based)
        size (integer) - Number of items per page
        totalElements (integer) - Total number of sessions
        totalPages (integer) - Total number of pages
        hasNext (boolean) - Whether there is a next page
        hasPrevious (boolean) - Whether there is a previous page
    message (string) - Human-readable description of the result
    timestamp (string) - ISO 8601 timestamp when the response was generated
    version (string) - API version used for the request

Response Codes

    200 OK - Sessions retrieved successfully
    400 Bad Request - Invalid request parameters
    401 Unauthorized - Invalid API key
    404 Not Found - Agent not found or doesn't belong to project
    429 Too Many Requests - Rate limit exceeded

Get Agent Session by ID

Retrieves detailed information about a specific session including chat history, metrics, and session state.
Endpoint

GET /agents/{agentId}/sessions/{sessionId}

Path Parameters

    agentId (required) - The agent identifier (e.g., "agent-abc123")
    sessionId (required) - The session identifier (e.g., "session-xyz789")

Query Parameters

    user_id (string, required) - User ID for tracking
    dbId (string, optional) - Optional database ID for multi-tenant scenarios

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/agent-abc123/sessions/session-xyz789?user_id=user-12345" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response

{
  "success": true,
  "data": {
    "userId": "user-12345",
    "sessionId": "session-xyz789",
    "sessionName": "Customer Support Chat",
    "sessionSummary": {
      "summary": "User inquired about product features and pricing",
      "updatedAt": "2025-10-27T10:20:45"
    },
    "sessionState": {
      "lastMessage": "How can I help you?",
      "messageCount": 5,
      "context": {}
    },
    "componentId": "agent-abc123",
    "totalTokens": 1250,
    "componentData": {
      "agentName": "Customer Support Bot",
      "agentVersion": "1.0"
    },
    "metrics": {
      "inputTokens": 650,
      "outputTokens": 600,
      "totalTokens": 1250
    },
    "chatHistory": [
      {
        "role": "user",
        "content": "Hello, I need help",
        "timestamp": "2025-10-27T10:15:30Z"
      },
      {
        "role": "assistant",
        "content": "Hello! How can I assist you today?",
        "timestamp": "2025-10-27T10:15:32Z"
      }
    ],
    "createdAt": "2025-10-27T10:15:30Z",
    "updatedAt": "2025-10-27T10:20:45Z"
  },
  "message": "Session retrieved successfully",
  "timestamp": "2025-10-28T10:15:00Z",
  "version": "v1"
}

Response Field Descriptions

    success (boolean) - Indicates if the request was successful
    data (object) - Session details
        userId (string) - User ID associated with the session
        sessionId (string) - Unique session identifier
        sessionName (string) - Human-readable session name
        sessionSummary (object, nullable) - Session summary information
            summary (string) - Text summary of the session
            updatedAt (string) - When summary was last updated
        sessionState (object) - Current session state data
        componentId (string) - Agent ID associated with this session
        totalTokens (integer) - Total tokens used in this session
        componentData (object) - Additional agent-specific data
        metrics (object) - Session token metrics
            inputTokens (integer) - Total input tokens used
            outputTokens (integer) - Total output tokens generated
            totalTokens (integer) - Sum of input and output tokens
        chatHistory (array) - Array of chat messages
        createdAt (string) - ISO 8601 timestamp when session was created
        updatedAt (string) - ISO 8601 timestamp when session was last updated
    message (string) - Human-readable description of the result
    timestamp (string) - ISO 8601 timestamp when the response was generated
    version (string) - API version used for the request

Response Codes

    200 OK - Session retrieved successfully
    401 Unauthorized - Invalid or missing API key
    404 Not Found - Agent or session not found

Delete Agent Session

Permanently deletes a specific session for the agent. This action cannot be undone.
Endpoint

DELETE /agents/{agentId}/sessions/{sessionId}

Path Parameters

    agentId (required) - The agent identifier (e.g., "agent-abc123")
    sessionId (required) - The session identifier (e.g., "session-xyz789")

Query Parameters

    user_id (string, required) - User ID for tracking
    dbId (string, optional) - Optional database ID for multi-tenant scenarios

Example Request

curl -X DELETE "${SIRMA_AI_DOMAIN}/client/api/v1/agents/agent-abc123/sessions/session-xyz789?user_id=user-12345" \
  -H "X-API-Key: ${YOUR_API_KEY}"

Response

HTTP/1.1 204 No Content

Response Codes

    204 No Content - Session deleted successfully
    401 Unauthorized - Invalid or missing API key
    404 Not Found - Agent or session not found

Get Agent Session Runs

Returns all runs (execution history) for a specific session. Each run represents one agent execution within the session.
Endpoint

GET /agents/{agentId}/sessions/{sessionId}/runs

Path Parameters

    agentId (required) - The agent identifier (e.g., "agent-abc123")
    sessionId (required) - The session identifier (e.g., "session-xyz789")

Query Parameters

    user_id (string, required) - User ID for tracking
    dbId (string, optional) - Optional database ID for multi-tenant scenarios

Example Request

curl -X GET "${SIRMA_AI_DOMAIN}/client/api/v1/agents/agent-abc123/sessions/session-xyz789/runs?user_id=user-12345" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json"

Response

{
  "success": true,
  "data": [
    {
      "runId": "run-001",
      "parentRunId": null,
      "componentId": "agent-abc123",
      "userId": "user-12345",
      "runInput": "What are your business hours?",
      "content": "Our business hours are Monday through Friday, 9 AM to 5 PM EST.",
      "status": "completed",
      "contentType": "text/plain",
      "runResponseFormat": "text",
      "metrics": {
        "inputTokens": 45,
        "outputTokens": 38,
        "totalTokens": 83
      },
      "events": [],
      "messages": [
        {
          "role": "user",
          "content": "What are your business hours?"
        },
        {
          "role": "assistant",
          "content": "Our business hours are Monday through Friday, 9 AM to 5 PM EST."
        }
      ],
      "stepResults": [],
      "stepExecutorRuns": [],
      "createdAt": "2025-10-27T10:15:35Z"
    },
    {
      "runId": "run-002",
      "parentRunId": "run-001",
      "componentId": "agent-abc123",
      "userId": "user-12345",
      "runInput": "Do you offer weekend support?",
      "content": "We offer limited weekend support for premium customers. Please contact our support team for details.",
      "status": "completed",
      "contentType": "text/plain",
      "runResponseFormat": "text",
      "metrics": {
        "inputTokens": 52,
        "outputTokens": 67,
        "totalTokens": 119
      },
      "events": [],
      "messages": [
        {
          "role": "user",
          "content": "Do you offer weekend support?"
        },
        {
          "role": "assistant",
          "content": "We offer limited weekend support for premium customers. Please contact our support team for details."
        }
      ],
      "stepResults": [],
      "stepExecutorRuns": [],
      "createdAt": "2025-10-27T10:16:42Z"
    }
  ],
  "message": "Session runs retrieved successfully",
  "timestamp": "2025-10-28T10:15:00Z",
  "version": "v1"
}

Response Field Descriptions

    success (boolean) - Indicates if the request was successful
    data (array) - List of run objects
        runId (string) - Unique run identifier
        parentRunId (string, nullable) - Parent run ID if this is a nested run
        componentId (string) - Agent ID that executed this run
        userId (string) - User ID associated with this run
        runInput (string) - Input message/prompt for this run
        content (string) - Output content/response from this run
        status (string) - Run status (e.g., "completed", "failed", "running")
        contentType (string) - MIME type of the content
        runResponseFormat (string) - Format of the response
        metrics (object) - Token usage metrics for this run
            inputTokens (integer) - Input tokens used
            outputTokens (integer) - Output tokens generated
            totalTokens (integer) - Total tokens used
        events (array) - List of events that occurred during execution
        messages (array) - List of messages exchanged during this run
        stepResults (array) - Results from individual execution steps
        stepExecutorRuns (array) - Nested executor runs if applicable
        createdAt (string) - ISO 8601 timestamp when run was created
    message (string) - Human-readable description of the result
    timestamp (string) - ISO 8601 timestamp when the response was generated
    version (string) - API version used for the request

Response Codes

    200 OK - Session runs retrieved successfully
    401 Unauthorized - Invalid or missing API key
    404 Not Found - Agent or session not found

Rename Agent Session

Updates the name of a specific session. Useful for organizing and identifying sessions.
Endpoint

POST /agents/{agentId}/sessions/{sessionId}/rename

Path Parameters

    agentId (required) - The agent identifier (e.g., "agent-abc123")
    sessionId (required) - The session identifier (e.g., "session-xyz789")

Query Parameters

    user_id (string, required) - User ID for tracking
    dbId (string, optional) - Optional database ID for multi-tenant scenarios

Request Body

{
  "sessionName": "Updated Session Name"
}

Request Field Descriptions

    sessionName (string, required) - New name for the session

Example Request

curl -X POST "${SIRMA_AI_DOMAIN}/client/api/v1/agents/agent-abc123/sessions/session-xyz789/rename?user_id=user-12345" \
  -H "X-API-Key: ${YOUR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "Premium Customer Support - October"
  }'

Response

{
  "success": true,
  "data": {
    "userId": "user-12345",
    "sessionId": "session-xyz789",
    "sessionName": "Premium Customer Support - October",
    "sessionSummary": {
      "summary": "User inquired about product features and pricing",
      "updatedAt": "2025-10-27T10:20:45"
    },
    "sessionState": {
      "lastMessage": "How can I help you?",
      "messageCount": 5
    },
    "componentId": "agent-abc123",
    "totalTokens": 1250,
    "componentData": {
      "agentName": "Customer Support Bot",
      "agentVersion": "1.0"
    },
    "metrics": {
      "inputTokens": 650,
      "outputTokens": 600,
      "totalTokens": 1250
    },
    "chatHistory": [
      {
        "role": "user",
        "content": "Hello, I need help",
        "timestamp": "2025-10-27T10:15:30Z"
      }
    ],
    "createdAt": "2025-10-27T10:15:30Z",
    "updatedAt": "2025-10-28T10:15:00Z"
  },
  "message": "Session renamed successfully",
  "timestamp": "2025-10-28T10:15:00Z",
  "version": "v1"
}

Response Field Descriptions

Same as Get Agent Session by ID response.
Response Codes

    200 OK - Session renamed successfully
    400 Bad Request - Invalid request data
    401 Unauthorized - Invalid or missing API key
    404 Not Found - Agent or session not found

Error Handling
Common Error Responses
Agent Not Found

{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with ID agent-invalid-123 not found in this project"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Session Not Found

{
  "success": false,
  "error": {
    "code": "AGENT_SESSION_NOT_FOUND",
    "message": "Session 'session-invalid-789' not found"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Session Belongs to Different Agent

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Session session-xyz789 does not belong to agent agent-abc123"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Session Belongs to Different User

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Session session-xyz789 does not belong to user user-12345"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Invalid Request Parameters

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request parameters: page must be greater than 0"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Missing Required Parameter

{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Missing required parameter: user_id must not be null or empty"
  },
  "timestamp": "2025-10-28T10:30:00Z",
  "version": "v1"
}

Use Cases
Session Management

    List All Sessions: View all conversation sessions for an agent
    Session Details: Retrieve complete session information including chat history and metrics
    Delete Sessions: Clean up old or unnecessary sessions
    Rename Sessions: Organize sessions with meaningful names
    Session History: Track all runs (executions) within a session

Analytics and Monitoring

    Token Usage Tracking: Monitor token consumption per session and per run
    Conversation Analysis: Analyze chat history and session summaries
    Performance Monitoring: Track execution times and status of runs
    User Activity: Track user interactions across sessions

Multi-Tenant Applications

    User Isolation: Sessions are isolated per user_id
    Database Segregation: Use dbId parameter for multi-database scenarios
    Agent Association: Sessions are tied to specific agents

Rate Limiting

Agent session endpoints are subject to rate limiting. Monitor these headers:

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60

Rate Limit Best Practices

    Implement exponential backoff for 429 errors
    Monitor rate limit headers in responses
    Cache session data when appropriate
    Batch operations when possible
    Consider upgrading limits for high-volume usage

Best Practices
Session Organization

    Use descriptive session names for easy identification
    Rename sessions after initial creation with meaningful context
    Delete old sessions to reduce clutter and storage costs
    Use session state to store custom metadata

User ID Management

    Always use consistent user_id values for the same user
    Validate user_id on the client side before making requests
    Sessions are strictly isolated by user_id for security

Pagination

    Use reasonable page sizes (default 20 is recommended)
    Implement pagination UI for better user experience
    Cache paginated results when appropriate
    Use sortBy and sortOrder for consistent ordering

Error Handling

    Always check the success field in responses
    Parse error codes for specific handling logic
    Implement retry logic with exponential backoff
    Log errors for debugging and monitoring
    Handle 404 errors gracefully (agent or session not found)

Session State

    Use sessionState to store custom application data
    Keep session state size reasonable (avoid large objects)
    Update session state through agent runs, not directly
    Session state persists across runs within the same session

Token Tracking

    Monitor metrics at both session and run levels
    Use metrics for cost tracking and optimization
    Track token usage trends over time
    Set up alerts for unusual token consumption

Multi-Tenant Scenarios

    Use dbId parameter consistently for each tenant
    Ensure proper isolation between tenants
    Validate agent access for each project/organization
    Test cross-tenant isolation thoroughly

On this page
Previous
Agent Management
Next
Team Management
