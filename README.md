# Iterative Planning Tool with Explanations - BACKEND

TODO

## Dependencies

1. XPP Utils (https://github.com/XPP-explainable-planning/xpp-utils)
2. MongoDB (https://www.mongodb.com/)
3. VAL (https://nms.kcl.ac.uk/planning/software/val.html)
4. Spot (https://spot.lrde.epita.fr/)
5. LTLfKit(https://bitbucket.org/acamacho/ltlfkit/src/master/)

### Environment

```
# mogo database URL
MONGO=
# JSON web-tocken key
JWT_KEY=
# server port
PORT=

# all absolute paths
# folder to store temporally the planner runs
EXPERIMENTROOTPATH=
# path to fast-downward folder
PLANNER=

# XPP Utils: path to demo_generator, max_utils and property_plan_checker
PROPERTYCHECKER=
DEMOGENERATOR=
MAXUTILITY=

# path to folders accessible by the server ...
# uploaded images and pddl files (.../src/app/dist/out-tsc/data/uploads)
UPLOADPATH=
# planner rusults  (.../src/app/dist/out-tsc/data/results)
RESULTPATH=/results

SERVERRESULTPATH=

# path to LTLdKit folder
LTLFKIT=
# path to Spot bin folder
SPOT=
# path to folder with validate executable
VAL=
```

## Docker

`https://hub.docker.com/r/eifler/xpp-iter-planning-tool`
