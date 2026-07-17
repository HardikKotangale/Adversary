import { Router } from "express";
import { startSSE, sendEvent } from "./sse.js";
import { runDebate, runAddRole } from "./debateService.js";
import type { RoleInput } from "./types.js";

export const router = Router();

const MIN_PITCH_LENGTH = 40;
const CUSTOM_ROLE_NAME_MIN = 2;
const CUSTOM_ROLE_NAME_MAX = 60;
const CUSTOM_DESCRIPTION_MIN = 10;
const CUSTOM_DESCRIPTION_MAX = 300;

router.post("/debate", async (req, res) => {
  const pitch = typeof req.body?.pitch === "string" ? req.body.pitch.trim() : "";
  if (pitch.length < MIN_PITCH_LENGTH) {
    res.status(400).json({ error: `Pitch must be at least ${MIN_PITCH_LENGTH} characters.` });
    return;
  }

  startSSE(res);
  try {
    await runDebate(pitch, res);
  } catch (err) {
    console.error("unhandled error in runDebate:", err);
    sendEvent(res, { type: "error", message: "Internal server error." });
    res.end();
  }
});

router.post("/debate/:id/add-role", async (req, res) => {
  const { id } = req.params;
  const roleId = typeof req.body?.roleId === "string" ? req.body.roleId.trim() : "";
  const customRoleName =
    typeof req.body?.customRoleName === "string" ? req.body.customRoleName.trim() : "";
  const customDescription =
    typeof req.body?.customDescription === "string" ? req.body.customDescription.trim() : "";

  let roleInput: RoleInput;
  if (roleId) {
    roleInput = { roleId };
  } else if (customRoleName || customDescription) {
    if (customRoleName.length < CUSTOM_ROLE_NAME_MIN || customRoleName.length > CUSTOM_ROLE_NAME_MAX) {
      res
        .status(400)
        .json({ error: `Role name must be ${CUSTOM_ROLE_NAME_MIN}-${CUSTOM_ROLE_NAME_MAX} characters.` });
      return;
    }
    if (
      customDescription.length < CUSTOM_DESCRIPTION_MIN ||
      customDescription.length > CUSTOM_DESCRIPTION_MAX
    ) {
      res.status(400).json({
        error: `Description must be ${CUSTOM_DESCRIPTION_MIN}-${CUSTOM_DESCRIPTION_MAX} characters.`,
      });
      return;
    }
    roleInput = { customRoleName, customDescription };
  } else {
    res.status(400).json({ error: "roleId or customRoleName+customDescription is required." });
    return;
  }

  startSSE(res);
  try {
    await runAddRole(id, roleInput, res);
  } catch (err) {
    console.error("unhandled error in runAddRole:", err);
    sendEvent(res, { type: "error", message: "Internal server error." });
    res.end();
  }
});
