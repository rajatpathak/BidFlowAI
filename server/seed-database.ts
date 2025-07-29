import { db } from "./db";
import { 
  users, 
  departments, 
  roles, 
  userRoles, 
  companySettings,
  tenders
} from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database with initial data...");

  try {
    // Clear existing data first
    await db.delete(userRoles);
    await db.delete(users);
    await db.delete(roles);
    await db.delete(departments);
    // Create departments
    const [engineeringDept] = await db.insert(departments).values({
      name: "Engineering",
      description: "Civil and Construction Engineering",
    }).returning();

    const [financeDept] = await db.insert(departments).values({
      name: "Finance",
      description: "Financial Management and Accounts",
    }).returning();

    const [adminDept] = await db.insert(departments).values({
      name: "Administration",
      description: "Administrative Operations",
    }).returning();

    // Create roles
    const [adminRole] = await db.insert(roles).values({
      name: "Admin",
      description: "System Administrator",
      permissions: ["all"],
    }).returning();

    const [financeManagerRole] = await db.insert(roles).values({
      name: "Finance Manager",
      description: "Financial Operations Manager",
      permissions: ["finance", "view_tenders", "view_reports"],
    }).returning();

    const [seniorBidderRole] = await db.insert(roles).values({
      name: "Senior Bidder",
      description: "Senior Bid Preparation Specialist",
      permissions: ["create_bids", "view_tenders", "assign_tenders"],
    }).returning();

    // Create users with demo passwords
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: "admin123", // Demo password - in production, this would be properly hashed
      email: "admin@techconstruct.com",
      name: "System Administrator",
      role: "admin",
    }).returning();

    const [financeUser] = await db.insert(users).values({
      username: "finance_manager",
      password: "finance123", // Demo password
      email: "finance@techconstruct.com",
      name: "Priya Sharma",
      role: "finance_manager",
    }).returning();

    const [bidderUser] = await db.insert(users).values({
      username: "senior_bidder",
      password: "bidder123", // Demo password
      email: "bidder@techconstruct.com",
      name: "Rahul Kumar",
      role: "senior_bidder",
    }).returning();

    // Assign roles to users
    await db.insert(userRoles).values([
      { userId: adminUser.id, roleId: adminRole.id },
      { userId: financeUser.id, roleId: financeManagerRole.id },
      { userId: bidderUser.id, roleId: seniorBidderRole.id },
    ]);

    // Create company settings
    await db.insert(companySettings).values({
      companyName: "TechConstruct Solutions Pvt Ltd",
      turnoverCriteria: "5 Crores",
      businessSectors: ["Construction", "Infrastructure", "Roads", "Buildings", "Civil Engineering"],
      certifications: ["ISO 9001", "ISO 14001", "OHSAS 18001", "CPWD", "PWD"],
      headquarters: "Tech Park, Sector 5, Gurgaon, Haryana 122001",
      establishedYear: 2015,
      updatedBy: adminUser.id,
    });

    // Create some sample tenders
    await db.insert(tenders).values([
      {
        title: "Construction of District Court Building",
        organization: "Public Works Department",
        description: "Construction of new district court building with modern facilities",
        value: 1200000000, // 12 Crores in paise
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "active",
        location: "Gurgaon, Haryana",
        requirements: {
          turnover: "8 Crores",
          experience: "5 years in government projects",
          classification: "Class A contractor"
        },
        aiScore: 95,
      },
      {
        title: "Road Construction Project Phase 2",
        organization: "National Highways Authority",
        description: "4-lane highway construction project spanning 25 km",
        value: 2500000000, // 25 Crores in paise
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        status: "active",
        location: "Delhi-Gurgaon Expressway",
        requirements: {
          turnover: "15 Crores",
          experience: "Highway construction experience",
          equipment: "Paving machinery required"
        },
        aiScore: 75,
      },
      {
        title: "School Building Renovation",
        organization: "Delhi Municipal Corporation",
        description: "Complete renovation of government school building",
        value: 35000000, // 35 Lakhs in paise
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        status: "active",
        location: "Central Delhi",
        requirements: {
          turnover: "2 Crores",
          experience: "Building renovation experience"
        },
        aiScore: 90,
      }
    ]);

    console.log("Database seeded successfully!");
    console.log("Demo users created:");
    console.log("- Admin: admin@techconstruct.com");
    console.log("- Finance Manager: finance@techconstruct.com");
    console.log("- Senior Bidder: bidder@techconstruct.com");

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}