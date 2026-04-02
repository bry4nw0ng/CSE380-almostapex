import Stack from "../../Wolfie2D/DataTypes/Collections/Stack";
import Vec2 from "../../Wolfie2D/DataTypes/Vec2";
import NavigationPath from "../../Wolfie2D/Pathfinding/NavigationPath";
import NavPathStrat from "../../Wolfie2D/Pathfinding/Strategies/NavigationStrategy";
import GraphUtils from "../../Wolfie2D/Utils/GraphUtils";

// TODO Construct a NavigationPath object using A*

/**
 * The AstarStrategy class is an extension of the abstract NavPathStrategy class. For our navigation system, you can
 * now specify and define your own pathfinding strategy. Originally, the two options were to use Djikstras or a
 * direct (point A -> point B) strategy. The only way to change how the pathfinding was done was by hard-coding things
 * into the classes associated with the navigation system. 
 * 
 */
export default class AstarStrategy extends NavPathStrat {

    /*
     * @see NavPathStrat.buildPath()
     * used this source: https://csis.pace.edu/~benjamin/courses/cs627/webfiles/Astar.pdf
     *Need F = G + H where G is total distance (nodes) to end, H is manhattan to end w/o obstacles
     *
     */

    public buildPath(to: Vec2, from: Vec2): NavigationPath {
        let graph = this.mesh.graph;
        // console.log(graph);
        let startNode = graph.snap(from);
        let endNode = graph.snap(to);
        let curNode = startNode;
        let curPos = graph.getNodePosition(curNode);
        let endPos = graph.getNodePosition(endNode);

        let openList = [curNode];

        //Stack for final path, figured out that need Vec2: position and not index
        let bestPath = new Stack<Vec2>()

        //finished for when backtracking, no idea how to do yet, but if has no unvisited edges, then finished
        let nodeAtt = new Map<number, {parInd: number, finished: boolean, g: number, h: number, f: number}>(); 
        
        //nodeAtt.set(curNode, {{parInd: , finished: false, g: , h: , f: }) (for copy/paste)
        let initHF = this.heuristicDist(to, from);
        nodeAtt.set(curNode, {parInd: -1, finished: false, g: 0, h: initHF, f: initHF});

        //if there is options to look at, continue, else? Didnt find
        while (openList.length >= 1) {   

            //IMPORTANT: curNode = best option in openList by f and then remove
            let minF = Infinity;
            openList.forEach((option) => {
                let fVal = nodeAtt.get(option)!.f;
                if (fVal < minF) {
                    minF = fVal;
                    curNode = option;
                }
            });

            //Remove current from list so it doesnt get chosen again for whatever reason
            openList = openList.filter(n => n != curNode);

            //Hip hip hooray, found
            if (curNode == endNode) {
                break;
            }

            let curEList = graph.getEdges(curNode);
            //While edge exists in reachable to curNode
            while (curEList) {
                let curOpt = curEList.y;
                let infoCurOpt = nodeAtt.get(curOpt);
                //if finished check next
                if (infoCurOpt && infoCurOpt.finished) {
                    curEList = curEList.next;
                    continue;
                }
                let newG = nodeAtt.get(curNode)!.g + 1;
                let newH = this.heuristicDist(endPos, graph.getNodePosition(curOpt));
                if (!infoCurOpt || newG < infoCurOpt!.g)
                    nodeAtt.set(curOpt, {
                        parInd: curNode,
                        finished: false,
                        g: newG,
                        h: newH,
                        f: newG + newH
                    });
                if (!openList.includes(curOpt)) {
                    openList.push(curOpt);
                }
                curEList = curEList.next;
            }
            if (!curEList) {
                //found the idea of keeping some attributes using set online, gotta be a better way to do this
                //This acts as my closed list
                nodeAtt.set(curNode, {...nodeAtt.get(curNode), finished: true});
            }
        }

        //Building bestPath
        //Moving from curNode (should = endNode now), should be defined, if not, probably didnt find/couldnt reach? 
        //Ends at -1, I init the starting node with parent of -1 tf: once reach, we are at the current node position
        while (curNode != -1) {
            bestPath.push(graph.getNodePosition(curNode));
            // console.log("Pushing: " + graph.getNodePosition(curNode));
            curNode = nodeAtt.get(curNode)!.parInd;
        }

        return new NavigationPath(bestPath);
    }
    
    //Manhattan h calc
    public heuristicDist(to: Vec2, from: Vec2): number {
        let tileSize = new Vec2(8,8);
        let xDist = Math.abs(from.x - to.x) / tileSize.x;
        let yDist = Math.abs(from.y - to.y) / tileSize.y;
        let totDist = xDist + yDist;
        return totDist;
    }
}