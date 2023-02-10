import express, { response } from "express";
import db from "../../../db";
import { fetchAllBriefs, insertBrief, upsertItems, searchBriefs, BriefSqlFilter, Brief, incrementUserBriefSubmissions, fetchBrief } from "../../../models";
import { json } from "stream/consumers";



const router = express.Router();

router.get("/", (req, res, next) => {

    db.transaction(async tx => {
        try {
            const briefs = await fetchAllBriefs()(tx);
            res.send(briefs);
        } catch (e) {
            next(new Error(
                `Failed to fetch all briefs`,
                {cause: e as Error}
            ));
        }
    });
});

router.get("/:id", (req, res, next) => {
    const id = req.params.id;
    db.transaction(async tx => {
        try {
            const briefs = await fetchBrief(id)(tx);
            res.send(briefs);
        } catch (e) {
            next(new Error(
                `Failed to fetch brief with id ${id}`,
                {cause: e as Error}
            ));
        }
    });
});

router.post("/", (req, res, next) => {
    const {
        headline,
        industries,
        description,
        skills,
        experience_id,
        scope_id,
        duration_id,
        budget,
        user_id
    } = req.body


    db.transaction(async tx => {
        try {
            const skill_ids = await upsertItems(skills, "skills")(tx);
            const industry_ids = await upsertItems(industries,"industries")(tx);

            const brief = await insertBrief({
                headline,
                industry_ids,
                description,
                skill_ids,
                experience_id,
                scope_id,
                duration_id,
                budget,
                user_id,
            })(tx);
    
            if (!brief.id) {
                return next(new Error(
                    "Failed to create brief."
                ));
            }

            await incrementUserBriefSubmissions(brief.user_id)(tx);
    
            res.status(201).send(
                {
                    status: "Successful",
                    brief_id: brief.id
                }
            );
        } catch (cause) {
            next(new Error(
                `Failed to insert brief .`,
                {cause: cause as Error}
            ));
        }
    });
});


router.post("/search", (req, res, next) => {
    db.transaction(async tx => {
        try {
            const data: BriefSqlFilter = req.body;
            const briefs: Array<Brief> = await searchBriefs(tx, data);
            res.send(briefs);
        } catch (e) {
            next(new Error(
                `Failed to search all briefs`,
                {cause: e as Error}
            ));
        }
    });
});


export default router;
