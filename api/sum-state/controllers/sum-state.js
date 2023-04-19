"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async updateSumState(ctx) {
    const { id } = ctx.params;
    let {
      travel_costs,
      mission_representation_cost,
      additional_cost,
      go_pass_and_covid_test,
    } = ctx.request.body;
    let travelCostTampon = 0;
    let mission_representation_costTampon = 0;
    let gopassAndCovidTampon = 0;
    let additionCosts = 0;
    console.log({ id });
    const sumState = await strapi.query("sum-state").model.findOne({ _id: id });

    if (sumState.payed === true) {
      ctx.send({ message: "Cet état de somme a déjà été clôturé !" }, 401);
    } else {
      console.log({ sumState });
      const duration = parseInt(sumState.duration);
      //On vérifie si le travel cost fait partie des champs à modifier

      if (travel_costs) {
        travelCostTampon = parseFloat(travel_costs);
      } else {
        travel_costs = 0;
      }

      if (mission_representation_cost) {
        mission_representation_costTampon = parseFloat(
          mission_representation_cost
        );
      } else {
        mission_representation_cost = 0;
      }

      if (go_pass_and_covid_test) {
        gopassAndCovidTampon = parseFloat(go_pass_and_covid_test);
      }

      if (additional_cost && additional_cost.length > 0) {
        additional_cost.forEach(({ cost }) => {
          console.log({ cost });
          additionCosts += parseInt(cost);
          console.log({ additionCosts });
        });
      } else if (!additional_cost) {
        additional_cost = [];
      }

      const missionExpensive = await strapi
        .query("mission-expensive")
        .model.findOne({ _id: sumState.mission_expensive });

      if (go_pass_and_covid_test) {
        await strapi
          .query("mission-expensive")
          .model.updateOne({ go_pass_and_covid_test });
        //Travel_costs
      }

      //mission_representation_cost
      // parseInt(missionExpensive.unit_price + additionCosts +
      let cost =
        (parseInt(missionExpensive.unit_price) + gopassAndCovidTampon) *
          duration +
        (mission_representation_costTampon + additionCosts + travelCostTampon);
      console.log({ cost });

      if (cost) {
        const sumStateUpdated = await strapi.query("sum-state").model.updateOne(
          { _id: id },
          {
            cost,
            travel_costs,
            mission_representation_cost,
            additional_cost,
          }
        );
        ctx.send(sumStateUpdated, 201);
      } else {
        ctx.send(401);
      }
    }
  },

  async updateSumStateLevel(ctx) {
    const { id, level } = ctx.params;

    const levels = await strapi.query("level").model.find();

    const sumState = await strapi.query("sum-state").model.findOne({ _id: id });

    let levelMatched;
    switch (level) {
      case "un":
        levelMatched = levels.find(({ title }) => title === "quatre");
        break;
      case "quatre":
        levelMatched = levels.find(({ title }) => title === "cinq");
        break;
      case "cinq":
        levelMatched = levels.find(({ title }) => title === "six");
        break;
      case "six":
        levelMatched = levels.find(({ title }) => title === "sept");
        break;

      default:
        levelMatched = levels.find(({ title }) => title === "six");
        break;
    }

    const sumStateUpdated = await strapi
      .query("sum-state")
      .model.updateOne({ _id: sumState._id }, { level: levelMatched._id });

    ctx.send(
      {
        data: sumStateUpdated,
        message: "Le niveau de l'état de mission a été mis à jour",
      },
      200
    );
  },
  async updatePaye(ctx) {
    try {
      const { id } = ctx.params;
      const missionId = id;
      console.log({ id });
      const sumState = await strapi.query("sum-state").find({
        "mission_order.id": id,
      });

      console.log({ sumState: sumState[0].payed });
      console.log({ sumState: sumState.length });

      if (sumState.length && sumState[0].payed === true) {
        ctx.send(
          { message: "Payement déjà éffectué pour cet ordre de mission" },
          401
        );
      } else {
        Promise.all(
          sumState.map(async ({ id }) => {
            console.log({ id });
            const sumStatePayed = await strapi
              .query("sum-state")
              .model.updateOne(
                {
                  _id: id,
                },
                {
                  payed: true,
                }
              );

            const level = await strapi
              .query("level")
              .model.findOne({ title: "onze" });

            const missionOrderUpdated = await strapi
              .query("mission-order")
              .model.updateOne({ _id: missionId }, { level: level._id });

            console.log({ missionOrderUpdated: missionOrderUpdated });
            console.log({ sumStatePayed: sumStatePayed });
          })
        );

        if (!sumState) return ctx.response.notFound("Order mission not found");

        return ctx.send(
          { message: "Le payement a été éffectué avec succès" },
          200
        );
      }
    } catch (error) {
      return error;
    }
  },
};
