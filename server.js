require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB database: studentDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Backend API is running"
  });
});

/*
  POST /api/students
  Create a new student
*/
app.post("/api/students", async (req, res) => {
  try {
    const { name, email, age, department } = req.body;

    if (!name || !email || !age || !department) {
      return res.status(400).json({
        success: false,
        message: "name, email, age, and department are required"
      });
    }

    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists"
      });
    }

    const student = await Student.create({
      name,
      email,
      age,
      department
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/*
  GET /api/students
  Get all students
*/
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  GET /api/students/:id
  Get one student by MongoDB ID
*/
app.get("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  POST /api/students/search
  Search students by name, email, or department
*/
app.post("/api/students/search", async (req, res) => {
  try {
    const { keyword } = req.body;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({
        success: false,
        message: "A text keyword is required"
      });
    }

    const students = await Student.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { department: { $regex: keyword, $options: "i" } }
      ]
    });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/*
  POST /api/students/:id/update
  Update a student
  POST is used because only GET and POST are allowed.
*/
app.post("/api/students/:id/update", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age, department } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (age !== undefined) updateData.age = age;
    if (department !== undefined) updateData.department = department;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update"
      });
    }

    if (email) {
      const duplicateEmailStudent = await Student.findOne({
        email,
        _id: { $ne: id }
      });

      if (duplicateEmailStudent) {
        return res.status(409).json({
          success: false,
          message: "Another student already uses this email"
        });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/*
  POST /api/students/:id/delete
  Delete a student
  POST is used because only GET and POST are allowed.
*/
app.post("/api/students/:id/delete", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      data: deletedStudent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});