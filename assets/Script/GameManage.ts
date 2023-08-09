import { _decorator, CCInteger, Component, EventHandler, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { BLOCK_SIZE, PlayerControll } from './PlayerControll';
const { ccclass, property } = _decorator;

/**
 * 地图类型
 */
enum BlockType {
    BT_NONE, //空
    BT_STONE, //方块
};

/**
 * 游戏状态
 */
enum GameState {
    GS_INIT, //游戏初始化，未开始
    GS_PALYING, //游戏中
    GS_END, //游戏结束
}


@ccclass('GameManage')
export class GameManage extends Component {
    @property({type: Prefab})
    public boxPrefab: Prefab|null = null;
    @property({type: CCInteger})
    public roadLength: number = 50;
    private _road: BlockType[] = [];//数组，用于存储地图数据，快速查询某个位置的图形
    @property({type: Node})
    public startMenu: Node | null = null;//开始菜单的UI
    @property({type: Node})
    public endMenu: Node | null = null;//结束菜单的UI
    @property({type: PlayerControll})
    public playerCtrl : PlayerControll | null = null;//角色控制器
    @property({type: Label})
    public stepLabel: Label | null = null;//计步器

    private _startGame = false;


    /**
     * 游戏初始化，需要做的事情
     * 1.初始化地图
     * 2.将角色放回初始位置
     * 3.显示UI
     */
    init() {
        if(this.startMenu) {
            this.startMenu.active = true;
        }

        if(this.endMenu) {
            this.endMenu.active = false;
        }

        this.generateRoad();

        if(this.playerCtrl) {
            // this.playerCtrl.setInputActive(false);
            this._startGame = false;
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
    }

    start() {
        // this.generateRoad();
        this.setCurState(GameState.GS_INIT);
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this)
    }
    /**
     * 此处使用了this.playerCtrl?.node 也就是PlayerControll的节点来接收事件
     * 在cocos creator中，某个节点派发的事件只能有这个节点的引用去监听
     */

    /**
     * 开始游戏
     * 1.隐藏StartMenu开始菜单
     * 2.重启设置计步器
     * 3.启用用户输入
     */
    playGame() {
        if (this.startMenu) {
            this.startMenu.active = false;
        }

        if (this.stepLabel) {
            this.stepLabel.string = '0';   // 将步数重置为0
        }

        this._startGame = true;

        // setTimeout(() => {      //直接设置active会直接开始监听鼠标事件，做了一下延迟处理
        //     if (this.playerCtrl) {
        //         this.playerCtrl.setInputActive(true);
        //     }
        // }, 0.1);
    }

    /**
     * 开始游戏按钮点击事件
     */
    onStartButtonClicked() {
        this.setCurState(GameState.GS_PALYING);
    }

    /**
     * 重新开始游戏按钮点击事件
     */
    onRestartButtonClicked() {
        if(this.endMenu) {
            this.endMenu.active = false;
        }
        this.setCurState(GameState.GS_INIT);
        if(this.startMenu) {
            this.startMenu.active = true;
        }
    }

    onOneStepBtnClicked() {
        if(!this._startGame) {
            return;
        }
        if(this.playerCtrl) {
            this.playerCtrl.jumpByStep(1);
        }
    }

    onTwoStepBtnClicked() {
        if(!this._startGame) {
            return;
        }
        if(this.playerCtrl) {
            this.playerCtrl.jumpByStep(2);
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        if(this.stepLabel) {
            this.stepLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        this.checkResult(moveIndex);
    }

    /**
     * 判断跳跃结果，是否跳到坑或者跳完所有的地块
     * @param moveIndex 跳跃到第几块
     */
    checkResult(moveIndex: number) {
        if(moveIndex < this.roadLength) {
            if(this._road[moveIndex] === BlockType.BT_NONE) {
                this.setCurState(GameState.GS_END);
            }
        } else {
            this.setCurState(GameState.GS_INIT);
        }
    }

    /**
     * 填充地图流程
     * 1.每次生成时，需要将上次的结果清除；
     * 2.第一个地块永远是方块，确保角色不会掉下去；
     * 3.由于角色只能跳1个或2个方块，因此空的位置不能超过2个，当前一块为空时，下一块必须为方块
     */
    generateRoad() {
        this.node.removeAllChildren();//清除之前的结果
        this._road = [];
        //startPos
        this._road.push(BlockType.BT_STONE);

        for(let i = 1; i < this.roadLength; i++) {
            if(this._road[i - 1] === BlockType.BT_NONE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for(let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockType(this._road[j]);
            if(block) {
                this.node.addChild(block);
                block.setPosition(j * BLOCK_SIZE, 0, 0);
            }
        }
     }
     /**
      * tips:
      * Math.floor —— TypeScript数学库的方法，向下取整。
      * Math.random —— 标准数学库的方法用于随机一个从0到1之间的小数，取值范围[0,1)
      * Math.floor(Math.random() * 2) —— 在[0,2)中随机取值并向下取整，得到的值为0或1.对应BlockType中的两个值。
      * 如果没有给枚举赋值时，那么枚举的值是按顺序从0开始分配
      */

     /**
      * 根据BlockType生成方块
      * @param type 类型
      */
     spawnBlockType(type: BlockType) {
        if(!this.boxPrefab) {
            return null;
        }

        let block: Node | null = null;
        switch(type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab);
                break;
        }

        return block;
     }
     /**
      * tips: instantiate是cocos creator提供的克隆预制体发方法，不仅可以克隆预制体，也可克隆别的类型，例如某个对象 
      */

     setCurState (value: GameState) {
        switch(value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PALYING:
                this.playGame();
                break;
            case GameState.GS_END:
                if(this.endMenu) {
                    this.endMenu.active = true;
                }
                // if(this.playerCtrl) {
                //     this.playerCtrl.setInputActive(false);
                // }
                this._startGame = false;
                break;
            
        }
     }
}


