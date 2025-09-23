//отсебятина для модулей без типов

declare module 'ml-regression' {
    export class PolynomialRegression {
        constructor(input: number[], output: number[], degree: number);
        predict(value: number): number;
    }
}

declare module 'plotly.js-dist' {
    import Plotly from 'plotly.js';
    export default Plotly;
}

declare module 'density-clustering' {
    export class DBSCAN {
        run(dataset: number[][], epsilon: number, minPts: number): number[][];
    }
}
