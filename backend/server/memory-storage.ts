// In-memory storage for demonstration purposes
export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface Tender {
  id: string;
  title: string;
  organization: string;
  description: string;
  value: number;
  deadline: Date;
  status: string;
  source: string;
  aiScore: number;
  location?: string;
  referenceNo?: string;
  createdAt: Date;
}

class MemoryStorage {
  private users: User[] = [];
  private tenders: Tender[] = [];
  private initialized = false;

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  initialize() {
    if (this.initialized) return;

    // Create sample users
    this.users = [
      {
        id: this.generateId(),
        username: 'admin',
        password: 'admin123',
        email: 'admin@company.com',
        name: 'System Administrator',
        role: 'admin',
        createdAt: new Date(),
      },
      {
        id: this.generateId(),
        username: 'finance',
        password: 'finance123',
        email: 'finance@company.com',
        name: 'Finance Manager',
        role: 'finance_manager',
        createdAt: new Date(),
      },
      {
        id: this.generateId(),
        username: 'bidder',
        password: 'bidder123',
        email: 'bidder@company.com',
        name: 'Senior Bidder',
        role: 'senior_bidder',
        createdAt: new Date(),
      }
    ];

    // Create sample tenders
    this.tenders = [
      {
        id: this.generateId(),
        title: 'Development of Mobile Application for Tax Collection',
        organization: 'Government of Karnataka',
        description: 'Development and implementation of mobile application for property tax collection',
        value: 50000000, // 5 lakh in cents
        deadline: new Date('2025-02-15'),
        status: 'active',
        source: 'gem',
        aiScore: 85,
        location: 'Bangalore',
        referenceNo: 'GOK/IT/2025/001',
        createdAt: new Date(),
      },
      {
        id: this.generateId(),
        title: 'Web Portal Development for Citizen Services',
        organization: 'Municipal Corporation',
        description: 'Development of citizen services web portal with online payment integration',
        value: 75000000, // 7.5 lakh in cents
        deadline: new Date('2025-03-01'),
        status: 'active',
        source: 'non_gem',
        aiScore: 92,
        location: 'Mumbai',
        referenceNo: 'MC/WEB/2025/002',
        createdAt: new Date(),
      },
      {
        id: this.generateId(),
        title: 'Software Maintenance and Support Services',
        organization: 'State Bank of India',
        description: 'Annual maintenance contract for existing banking software applications',
        value: 25000000, // 2.5 lakh in cents
        deadline: new Date('2025-01-31'),
        status: 'active',
        source: 'gem',
        aiScore: 78,
        location: 'Delhi',
        referenceNo: 'SBI/IT/2025/003',
        createdAt: new Date(),
      }
    ];

    this.initialized = true;
    console.log('✅ Memory storage initialized with sample data');
    console.log(`👤 Created ${this.users.length} users: ${this.users.map(u => u.username).join(', ')}`);
    console.log(`📋 Created ${this.tenders.length} tenders`);
  }

  // User methods
  async findUserByUsername(username: string): Promise<User | null> {
    this.initialize();
    console.log(`🔍 Looking for user: ${username}`);
    console.log(`👥 Available users: ${this.users.map(u => u.username).join(', ')}`);
    const found = this.users.find(user => user.username === username) || null;
    console.log(`✨ Result: ${found ? 'FOUND' : 'NOT FOUND'}`);
    return found;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    this.initialize();
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    this.initialize();
    return this.users;
  }

  // Tender methods
  async getAllTenders(filters?: any): Promise<{ tenders: Tender[], total: number }> {
    this.initialize();
    let filteredTenders = [...this.tenders];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredTenders = filteredTenders.filter(tender =>
        tender.title.toLowerCase().includes(search) ||
        tender.organization.toLowerCase().includes(search) ||
        tender.description?.toLowerCase().includes(search)
      );
    }

    if (filters?.source && filters.source !== 'all') {
      filteredTenders = filteredTenders.filter(tender => tender.source === filters.source);
    }

    if (filters?.status && filters.status !== 'all') {
      filteredTenders = filteredTenders.filter(tender => tender.status === filters.status);
    }

    return {
      tenders: filteredTenders,
      total: filteredTenders.length
    };
  }

  async getTenderById(id: string): Promise<Tender | null> {
    this.initialize();
    return this.tenders.find(tender => tender.id === id) || null;
  }

  async createTender(tenderData: Omit<Tender, 'id' | 'createdAt'>): Promise<Tender> {
    this.initialize();
    const tender: Tender = {
      ...tenderData,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.tenders.push(tender);
    return tender;
  }

  // Stats
  async getStats() {
    this.initialize();
    const activeTenders = this.tenders.filter(t => t.status === 'active').length;
    const totalValue = this.tenders.reduce((sum, t) => sum + t.value, 0);
    
    return {
      activeTenders,
      totalValue,
      winRate: 65,
      pendingApprovals: 2
    };
  }
}

export const memoryStorage = new MemoryStorage();