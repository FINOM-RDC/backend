"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createMissionOrder(ctx) {
    // 1 On recupère les inputs

    const {
      type,
      participants,
      subject,
      initiator,
      itinerary,
      start_date,
      end_date,
      reference,
      organization,
      mission_manager,
      destination,
      missionZone,
      transport,
      duration,
    } = ctx.request.body;

    const date1 = new Date(start_date);
    const date2 = new Date(end_date);
    const diffTime = Math.abs(date2 - date1);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const rangeDateIsPositive =
      Date.parse(new Date(end_date)) - Date.parse(new Date(start_date)) > 0;

    const rangeDateIsLessThanMaxDays = diffDays <= 15;

    if (!rangeDateIsPositive && (start_date || end_date)) {
      return {
        status: ctx.response.badRequest([
          "La date de fin de mission ne peut pas venir avant celle du début",
        ]),
      };
    } else {
      diffDays = duration;
    }

    if (!rangeDateIsLessThanMaxDays) {
      return {
        status: ctx.response.badRequest([
          "La durée de mission doit être inférieure ou égale à 15",
        ]),
      };
    }

    const level = await strapi.query("level").model.findOne({ title: "un" });

    const createMissionOrder = await strapi
      .query("mission-order")
      .model.create({
        type,
        participants,
        subject,
        initiator,
        itinerary,
        start_date: date1,
        end_date: date2,
        reference,
        organization,
        destination,
        mission_manager,
        mission_zone: missionZone,
        state: "pending",
        level: level._id,
        transport,
      });

    participants.forEach(async (participant) => {
      const participantFunction = await strapi
        .query("user", "users-permissions")
        .model.findOne({ _id: participant });

      const missionExpensive = await strapi
        .query("mission-expensive")
        .model.findOne({
          mission_zone: missionZone,
          minister_function: participantFunction.minister_function,
        });
      console.log({ missionExpensive });
      let cost =
        (parseFloat(missionExpensive.unit_price) +
          parseFloat(missionExpensive.go_pass_and_covid_test)) *
        diffDays;

      await strapi.query("sum-state").model.create({
        users: [participant],
        mission_order: createMissionOrder._id,
        state: "pending",
        duration: diffDays,
        cost,
        unit_price: !missionExpensive ? 200000 : missionExpensive.unit_price,
        travel_costs: 0,
        mission_representation_cost: 0,
        mission_expensive: missionExpensive._id,
      });
    });

    ctx.send(
      {
        data: createMissionOrder,
        message: "L'ordre de mission a été créé",
      },
      201
    );
  },
  async updateMissionOrderLevel(ctx) {
    const { id, level } = ctx.params;

    const levels = await strapi.query("level").model.find();

    const missionOrder = await strapi
      .query("mission-order")
      .model.findOne({ _id: id });

    let levelMatched;
    switch (level) {
      case "un":
        levelMatched = levels.find(({ title }) => title === "un");
        break;
      case "deux":
        levelMatched = levels.find(({ title }) => title === "deux");
        break;
      case "trois":
        levelMatched = levels.find(({ title }) => title === "trois");
        break;
      case "quatre":
        levelMatched = levels.find(({ title }) => title === "quatre");
        break;
      case "cinq":
        levelMatched = levels.find(({ title }) => title === "cinq");
        break;
      case "six":
        levelMatched = levels.find(({ title }) => title === "six");
        break;
      case "sept":
        levelMatched = levels.find(({ title }) => title === "sept");
        break;
      case "huit":
        levelMatched = levels.find(({ title }) => title === "huit");
        break;
      case "neuf":
        levelMatched = levels.find(({ title }) => title === "neuf");
        break;
      case "dix":
        levelMatched = levels.find(({ title }) => title === "dix");
        break;
      case "onze":
        levelMatched = levels.find(({ title }) => title === "onze");
        break;
      case "douze":
        levelMatched = levels.find(({ title }) => title === "douze");
        break;
      case "treize":
        levelMatched = levels.find(({ title }) => title === "treize");
        break;
      case "quatorze":
        levelMatched = levels.find(({ title }) => title === "quatorze");
        break;
      case "quinze":
        levelMatched = levels.find(({ title }) => title === "quinze");
        break;

      default:
        levelMatched = levels.find(({ title }) => title === "un");
        break;
    }

    const missionOrderUpdated = await strapi
      .query("mission-order")
      .model.updateOne({ _id: missionOrder._id }, { level: levelMatched._id });

    ctx.send(
      {
        data: missionOrderUpdated,
        message: "Le niveau de l'ordre de mission a été mis à jour",
      },
      200
    );
  },

  async updateMissionOrder(ctx) {
    // 1 On recupère les inputs
    const { id } = ctx.params;
    const {
      type,
      participants,
      subject,
      itinerary,
      organization,
      mission_manager,
      destination,
      missionZone,
      transport,
      missionLevel,
      state,
      comment,
    } = ctx.request.body;

    const missionOrder = await strapi.query("mission-order").model.findOne({
      _id: id,
    });

    console.log({ missionOrder });

    let level = await strapi
      .query("level")
      .model.findOne({ title: missionLevel });

    const updateMissionOrder = await strapi
      .query("mission-order")
      .model.updateOne({
        type: type ? type : missionOrder.type,
        participants: participants ? participants : missionOrder.participants,
        itinerary: itinerary ? itinerary : missionOrder.itinerary,
        organization: organization ? organization : missionOrder.organization,
        destination: destination ? destination : missionOrder.destination,
        mission_manager: mission_manager
          ? mission_manager
          : missionOrder.mission_manager,
        mission_zone: missionZone ? missionZone : missionOrder.mission_zone,
        state: state ? state : missionOrder.state,
        level: missionLevel ? level._id : missionOrder.level,
        transport: transport ? transport : missionOrder.transport,
        subject: subject ? subject : missionOrder.subject,
        comment: comment ? comment : "",
      });

    let sumStates = await strapi.query("sum-state").model.find({
      mission_order: updateMissionOrder._id,
    });

    sumStates.forEach(async (sumState) => {
      const participantFunction = await strapi
        .query("user", "users-permissions")
        .model.findOne({ _id: sumState.users[0] });

      console.log({ missionZone });
      console.log({ missionOrder });
      console.log({ participantFunction });
      const missionExpensive = await strapi
        .query("mission-expensive")
        .model.findOne({
          mission_zone: missionZone ? missionZone : missionOrder.mission_zone,
          minister_function: participantFunction.minister_function,
        });

      console.log({ missionExpensive });

      let cost =
        (parseFloat(missionExpensive.unit_price) +
          parseFloat(missionExpensive.go_pass_and_covid_test)) *
        diffDays;
      cost = !cost ? 0 : cost;

      await strapi.query("sum-state").model.updateOne(
        {
          _id: missionOrder.id,
        },
        { duration: diffDays, cost, mission_expensive: missionExpensive._id }
      );
    });

    ctx.send(
      {
        data: updateMissionOrder,
        message: "L'ordre de mission a été créé",
      },
      200
    );
  },
};
