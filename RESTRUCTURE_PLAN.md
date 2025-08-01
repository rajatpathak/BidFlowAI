# Project Restructure Plan

## Current Issues
1. Multiple conflicting directories (backend/, frontend/, client/, server/)
2. Duplicate configurations and package.json files
3. Complex build scripts and deployment files
4. Scattered server files with unused utilities
5. LSP diagnostics indicating code issues

## Clean Structure Target
```
bid-management-system/
├── src/
│   ├── client/           # React frontend
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   ├── server/           # Express backend
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   └── shared/           # Shared types and schemas
├── public/               # Static assets
├── uploads/              # File uploads
├── package.json          # Single package.json
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── vite.config.ts        # Vite config
└── README.md
```

## Action Plan
1. Consolidate all source code into single src/ directory
2. Remove duplicate directories and files
3. Clean up package.json and dependencies
4. Simplify build and deployment configuration
5. Fix all TypeScript and linting issues
6. Create single entry point for both frontend and backend