// test-aggregate-fix.js
require("dotenv").config();
const mongoose = require("mongoose");
const database = require("./config/database");
const Job = require("./models/Job");

async function testAggregate() {
  console.log("🧪 Testing aggregate query fix...\n");

  try {
    // 1. Connect
    await database.connect();
    console.log("✅ Database connected\n");

    // 2. Test aggregate langsung
    console.log("1. Testing direct aggregate query...");
    try {
      const result = await Job.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);
      console.log("   ✅ Aggregate successful");
      console.log(`   Result: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      console.log("   ❌ Aggregate error:", error.message);
      console.log("   Error stack:", error.stack);
    }

    // 3. Test countDocuments
    console.log("2. Testing countDocuments...");
    try {
      const total = await Job.countDocuments();
      const pending = await Job.countDocuments({ status: "pending" });
      const completed = await Job.countDocuments({ status: "completed" });

      console.log("   ✅ Count successful");
      console.log(`   Total: ${total}`);
      console.log(`   Pending: ${pending}`);
      console.log(`   Completed: ${completed}\n`);
    } catch (error) {
      console.log("   ❌ Count error:", error.message);
    }

    // 4. Test model structure
    console.log("3. Checking Job model structure...");
    console.log(`   Model name: ${Job.modelName}`);
    console.log(`   Collection name: ${Job.collection.collectionName}`);
    console.log(
      `   Schema paths: ${Object.keys(Job.schema.paths).join(", ")}\n`
    );

    console.log("🎉 Tests completed");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  } finally {
    await database.close();
  }
}

testAggregate().catch(console.error);
