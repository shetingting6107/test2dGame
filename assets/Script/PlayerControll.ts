import { _decorator, Component, Node, Vec3, EventMouse, input, Input, Animation } from 'cc';
const { ccclass, property } = _decorator;

export const BLOCK_SIZE = 40;

@ccclass('PlayerControll')
export class PlayerControll extends Component {

	@property(Animation)
	BodyAnim:Animation = null;

	private _startJump: boolean = false;//用于判断角色是否在跳跃状态
	private _jumpStep: number = 0;//跳跃步数，用于记录鼠标的输入，并将其转化为数值
	private _curJumpTime: number = 0;//当前的跳跃时间，每次跳跃前将此值置为0，在更新时进行累计并与_jumpTime进行比较，若超过了_jumpTime，则认为角色完成了一次完整的跳跃
	private _jumpTime: number = 0.1;//跳跃时间，记录整个跳跃的时长
	private _curJumpSpeed: number = 0;//移动速度，用于记录跳跃时的移动速度
	private _curPos: Vec3 = new Vec3();//当前的位置，记录和计算角色的当前位置
	private _deltaPos: Vec3 = new Vec3(0, 0, 0);//位移，记录位置与时间间隔的乘积，存储计算结果
	private _targetPos: Vec3 = new Vec3();//目前位置，最终的落点，跳跃结束时将角色位移到这个位置，以确保最终的位置正确，做到处理误差情况。
	private _curMoveIndex: number = 0;//记录角色当前多少步
	
    start() {
		// input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

	setInputActive(active: boolean) {
		// if(active) {
		// 	input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
		// }else {
		// 	input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
		// }
	}

	// onMouseUp(event: EventMouse) {
	// 	if(event.getButton() === 0) {
	// 		this.jumpByStep(1);
	// 	}else if(event.getButton() === 2) {
	// 		this.jumpByStep(2);
	// 	}
	// }

    update(deltaTime: number) {
		if(this._startJump) {
			this._curJumpTime += deltaTime;//累计总的跳跃时间
			if(this._curJumpTime > this._jumpTime) { //当跳跃时间是否结束
				//end
				this.node.setPosition(this._targetPos); //强制位置到终点
				this._startJump = false;
				this.onOnceJumpEnd();
			}else{
				//tween
				this.node.getPosition(this._curPos);
				this._deltaPos.x = this._curJumpSpeed * deltaTime;//每一帧根据速度和时间得出
				Vec3.add(this._curPos, this._curPos, this._deltaPos);//应用这个位移
				this.node.setPosition(this._curPos);//将位移设置给角色
			}
		}
        
    }
	
	jumpByStep(step: number) {
		if(this._startJump) {
			return;
		}
		this._startJump = true;//标记开始跳跃
		this._jumpStep = step;//跳跃的步数为1或2
		this._curJumpTime = 0;//重置开始跳跃的时间

		const clipName = step === 1 ? 'onStep' : 'twoStep';
		const state = this.BodyAnim.getState(clipName);
		this._jumpTime = state.duration;

		this._curJumpSpeed = this._jumpStep * BLOCK_SIZE / this._jumpTime;//根据时间计算速度
		this.node.getPosition(this._curPos);//获取角色当前位置
		Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep * BLOCK_SIZE, 0, 0));//计算出目标位置
		
		if(this.BodyAnim) {
			if(step === 1) {
				this.BodyAnim.play('onStep');
			}else if(step === 2) {
				this.BodyAnim.play('twoStep');
			}
		}
		this._curMoveIndex += step;
	}

	/**
	 * 监听跳跃结束的方法
	 * 派发了名为JumpEnd的事件，并将_curMoveIndex做为参数传递出去
	 */
	onOnceJumpEnd() {
		this.node.emit('JumpEnd', this._curMoveIndex);
	}

	reset() {
		this._curMoveIndex = 0;
	}
	
}


