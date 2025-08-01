// app.component.ts
import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { MyMonitoringService } from "./my-monitoring-service.service";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import confetti from "canvas-confetti";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = "Score";
  newPlayer: string;
  Players: string[] = [];
  distributor = 0;
  closeResult = "";
  totalpoints = 0;
  rejoinPlayers: number[] = [];
  rejoinedPlayers: number[] = [];
  Score: any = {};
  resetCountdown = 5;
  resetInterval: any;
  showName: boolean = false;
  winnerName: string;

  @ViewChild("totalPointsModal", { static: true })
  totalPointsModal: TemplateRef<any>;
  @ViewChild("rejoinModal", { static: true }) rejoinModal: TemplateRef<any>;
  @ViewChild("resetModal", { static: true }) resetModal: TemplateRef<any>;
  @ViewChild("scoreBody", { static: false }) scoreBody: ElementRef;

  @ViewChild("scoreTableWrapper", { static: false })
  scoreTableWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild("latestScoreRow", { static: false })
  latestScoreRow!: ElementRef<HTMLTableRowElement>;
  @ViewChild("confettiCanvas", { static: false })
  confettiCanvas!: ElementRef<HTMLCanvasElement>;
  private confettiInstance: confetti.CreateTypes | null = null;

  constructor(
    private modalService: NgbModal,
    private myMonitoringService: MyMonitoringService
  ) {}

  ngOnInit() {
    this.Players = JSON.parse(localStorage.getItem("players")) || [];
    this.Score = JSON.parse(localStorage.getItem("score")) || {};
    this.totalpoints = Number(localStorage.getItem("totalScore")) || 0;
    if (!this.Score.Scores) this.InitScore();
    if (this.totalpoints === 0) this.getTotalpoints();
    this.updateDistributor();
  }

  dropColumn(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.Players, event.previousIndex, event.currentIndex);
    this.updatePlayers();
    this.updateDistributor();
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.scoreTableWrapper && this.scoreTableWrapper.nativeElement) {
        const wrapper = this.scoreTableWrapper.nativeElement;
        wrapper.scrollTop = wrapper.scrollHeight;
      }
    }, 100);
  }

  AddScore() {
    if (this.Players && this.Players.length) {
      this.Players.forEach((p) => {
        const score = Number(
          (<HTMLInputElement>document.getElementById(p)).value
        );
        this.Score.Scores[p].push(score);
        (<HTMLInputElement>document.getElementById(p)).value = "";
      });
      this.Score.Games++;

      let activePlayers = [];

      for (const player in this.Score.Scores) {
        const totalScore = this.Score.Scores[player].reduce(
          (sum, val) => sum + val,
          0
        );
        if (totalScore < this.totalpoints) {
          activePlayers.push(player);
        }
      }

      if (activePlayers.length === 1) {
        this.winnerName = activePlayers[0];
      }
      else{
        this.winnerName = undefined;
      }

      if (!this.winnerName) {
        this.checkRejoin();
      }
      this.updateScore();
      this.updateDistributor();
      this.myMonitoringService.logEvent("AddScore", this.Score);
    } else {
      alert("Add players before adding score");
    }

    this.launchConfetti();
  }

  checkRejoin() {
    this.rejoinPlayers = [];
    let highestScore = -1;
    this.Players.forEach((p, i) => {
      const sum = this.sum(p);
      if (sum >= this.totalpoints) this.rejoinPlayers.push(i);
      else if (sum > highestScore) highestScore = sum;
    });

    if (this.rejoinPlayers.length === 0) return;

    this.modalService.open(this.rejoinModal).result.then(
      () => {
        this.rejoinPlayers = [];
        this.rejoin(this.rejoinedPlayers, highestScore);
      },
      () => this.checkRejoin()
    );
  }

  onChange(p: number, isChecked: boolean) {
    isChecked
      ? this.rejoinedPlayers.push(p)
      : this.rejoinedPlayers.splice(this.rejoinedPlayers.indexOf(p), 1);
    this.rejoinedPlayers = [...new Set(this.rejoinedPlayers)];
  }

  rejoin(players: number[], highestScore: number) {
    if (!players || players.length === 0) return;

    this.Players.forEach((p, i) => {
      this.Score.Scores[p].push(
        players.includes(i) ? (this.sum(p) - highestScore - 1) * -1 : 0
      );
    });

    this.rejoinedPlayers = [];
  }

  updateDistributor() {
    if (!this.Score) {
      return;
    }
    this.distributor =
      (this.Score.Games - 1 + this.Players.length) % this.Players.length;
  }

  ClearStorage() {
    localStorage.clear();
    location.reload();
  }

  AddPlayer() {
    if (
      this.Score &&
      this.Score.Scores &&
      this.Score.Scores[this.newPlayer] != undefined
    ) {
      this.Players.push(this.newPlayer);
      this.updatePlayers();
      this.newPlayer = "";
      return;
    }

    if (
      !this.newPlayer ||
      this.newPlayer.trim() === "" ||
      (this.Score.Games && !confirm("All Data will be lost"))
    )
      return;

    if (this.Players.includes(this.newPlayer)) return;

    this.Players.push(this.newPlayer);
    this.newPlayer = "";
    this.updatePlayers();
    this.InitScore();
    this.updateDistributor();
  }

  refreshScore() {
    if (!this.Score) {
      this.InitScore();
      return;
    }
  }

  InitScore() {
    this.Score = { Scores: {}, Games: 0 };
    this.Players.forEach((p) => (this.Score.Scores[p] = []));
    this.updateScore();
  }

  sum(player: string): number {
    return this.Score.Scores[player]
      ? this.Score.Scores[player].reduce((a, b) => a + b, 0)
      : 0;
  }

  DeleteScore() {
    if (this.Score.Games == 0) {
      return;
    }
    let isRejoin = false;
    this.Players.forEach((p) => {
      const last = this.Score.Scores[p].pop();
      (<HTMLInputElement>document.getElementById(p)).value = last;
      if (last < 0) isRejoin = true;
    });
    if (!isRejoin) {
      this.Score.Games--;
    }

    this.updateDistributor();
    this.updateScore();
  }

  RemovePlayer(player: string) {
    this.Players = this.Players.filter(
      (p) => p.toLowerCase() !== player.toLowerCase()
    );
    this.updatePlayers();
  }
  ngAfterViewInit(): void {
    // Attach confetti to the canvas
    this.confettiInstance = confetti.create(this.confettiCanvas.nativeElement, {
      resize: true,
      useWorker: true,
    });
  }

  updatePlayers() {
    localStorage.setItem("players", JSON.stringify(this.Players));
  }

  updateScore() {
    localStorage.setItem("score", JSON.stringify(this.Score));
  }

  getTotalpoints() {
    this.modalService.open(this.totalPointsModal).result.then(
      (result) => {
        this.totalpoints = result;
        localStorage.setItem("totalScore", result);
      },
      () => this.getTotalpoints()
    );
  }

  openResetModal() {
    this.resetCountdown = 5;
    this.modalService.open(this.resetModal);
    this.resetInterval = setInterval(() => {
      if (this.resetCountdown > 0) this.resetCountdown--;
      else clearInterval(this.resetInterval);
    }, 1000);
  }

  confirmReset(modal: any) {
    clearInterval(this.resetInterval);
    modal.close();
    this.ClearStorage();
  }

  launchConfetti(): void {
    if (this.winnerName) {
      this.launchHugeConfetti();
      return;
    }

    if (this.confettiInstance) {
      this.confettiInstance({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }

  launchHugeConfetti(): void {
    if (!this.confettiInstance) return;

    this.showName = true;

    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
      this.confettiInstance!({
        particleCount: 120, // reduced from 300
        spread: 200, // reduced from 360
        startVelocity: 40, // slower particles
        scalar: 1.2, // smaller size
        ticks: 70, // disappears quicker
        origin: {
          x: Math.random(),
          y: Math.random() * 0.4,
        },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    setTimeout(() => {
      this.showName = false;
    }, 3000);
  }
}
