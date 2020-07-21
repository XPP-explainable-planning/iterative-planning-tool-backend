
export class Environment {

    public experimentsRootPath = process.env.EXPERIMENTROOTPATH ? process.env.EXPERIMENTROOTPATH : '';
    public planner = process.env.PLANNER ? process.env.PLANNER : '';
    public propertyChecker = process.env.PROPERTYCHECKER ? process.env.PROPERTYCHECKER : '';
    public demoGenerator = process.env.DEMOGENERATOR ? process.env.DEMOGENERATOR : '';

    public uploadsPath =  process.env.UPLOADPATH ? process.env.UPLOADPATH : '';
    public resultsPath = process.env.RESULTPATH ? process.env.RESULTPATH : '';
    public serverResultsPath = process.env.SERVERRESULTPATH ? process.env.SERVERRESULTPATH : '';

    public ltltkit = process.env.LTLFKIT ? process.env.LTLFKIT : '';
    public spot = process.env.SPOT  ? process.env.SPOT : '';

    constructor() { }

}


