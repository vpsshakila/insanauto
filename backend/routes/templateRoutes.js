// routes/templateRoutes.js
const express = require("express");
const router = express.Router();
const templateService = require("../services/templateService");

// Get all templates
router.get("/", async (req, res) => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Add new template
router.post("/", async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({
        success: false,
        message: "Missing formData",
      });
    }

    const template = await templateService.addTemplate(formData);

    res.json({
      success: true,
      message: "Template added successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update template
router.put("/:id", async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData) {
      return res.status(400).json({
        success: false,
        message: "Missing formData",
      });
    }

    const template = await templateService.updateTemplate(
      req.params.id,
      formData
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      message: "Template updated successfully",
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete template
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await templateService.deleteTemplate(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
