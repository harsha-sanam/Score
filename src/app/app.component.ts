// app.component.ts
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MyMonitoringService } from './my-monitoring-service.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Score';
  newPlayer: string;
  Players: string[] = [];
  distributor = 0;
  closeResult = '';
  totalpoints = 0;
  rejoinPlayers: number[] = [];
  rejoinedPlayers: number[] = [];
  Score: any = {};
  resetCountdown = 5;
  resetInterval: any;

  @ViewChild('totalPointsModal', { static: true }) totalPointsModal: TemplateRef<any>;
  @ViewChild('rejoinModal', { static: true }) rejoinModal: TemplateRef<any>;
  @ViewChild('resetModal', { static: true }) resetModal: TemplateRef<any>;
  @ViewChild('scoreBody', { static: false }) scoreBody: ElementRef;

  @ViewChild('scoreTableWrapper', { static: false }) scoreTableWrapper!: ElementRef<HTMLDivElement>;
@ViewChild('latestScoreRow', { static: false }) latestScoreRow!: ElementRef<HTMLTableRowElement>;

  constructor(private modalService: NgbModal, private myMonitoringService: MyMonitoringService) { }

  ngOnInit() {
    this.Players = JSON.parse(localStorage.getItem('players')) || [];
    this.Score = JSON.parse(localStorage.getItem('score')) || {};
    this.totalpoints = Number(localStorage.getItem('totalScore')) || 0;
    if (!this.Score.Scores) this.InitScore();
    if (this.totalpoints === 0) this.getTotalpoints();
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
      this.Players.forEach(p => {
        const score = Number((<HTMLInputElement>document.getElementById(p)).value);
        this.Score.Scores[p].push(score);
        (<HTMLInputElement>document.getElementById(p)).value = "";
      });
      this.Score.Games++;
      this.checkRejoin();
      this.updateScore();
      this.nextDistributor();
      this.myMonitoringService.logEvent("AddScore", this.Score);

    } else {
      alert('Add players before adding score');
    }
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
    isChecked ? this.rejoinedPlayers.push(p) : this.rejoinedPlayers.splice(this.rejoinedPlayers.indexOf(p), 1);
    this.rejoinedPlayers = [...new Set(this.rejoinedPlayers)];
  }

  rejoin(players: number[], highestScore: number) {
    if (!players || players.length === 0) return;

    this.Players.forEach((p, i) => {
      this.Score.Scores[p].push(players.includes(i) ? (this.sum(p) - highestScore - 1) * -1 : 0);
    });

    this.rejoinedPlayers = [];
  }

  nextDistributor() {
    this.distributor = (this.distributor + 1) % this.Players.length;
  }

  ClearStorage() {
    localStorage.clear();
    location.reload();
  }

  AddPlayer() {
    if (!this.newPlayer || this.newPlayer.trim() === '' || (this.Score.Games && !confirm("All Data will be lost"))) return;
    
    if (this.Players.includes(this.newPlayer)) return;

    this.Players.push(this.newPlayer);
    this.newPlayer = "";
    this.updatePlayers();
    this.InitScore();
  }

  InitScore() {
    this.Score = { Scores: {}, Games: 0 };
    this.Players.forEach(p => this.Score.Scores[p] = []);
    this.updateScore();
  }

  sum(player: string): number {
    return this.Score.Scores[player] ? this.Score.Scores[player].reduce((a, b) => a + b, 0) : 0;
  }

  DeleteScore() {
    let isRejoin = false;
    this.Players.forEach(p => {
      const last = this.Score.Scores[p].pop();
      if (last < 0) isRejoin = true;
    });
    if (!isRejoin) {
      this.Score.Games--;
      this.distributor = (this.distributor + this.Players.length - 1) % this.Players.length;
    }
    
    this.updateScore();
  }

  RemovePlayer(player: string) {
    this.Players = this.Players.filter(p => p.toLowerCase() !== player.toLowerCase());
    this.updatePlayers();
  }

  updatePlayers() {
    localStorage.setItem('players', JSON.stringify(this.Players));
  }

  updateScore() {
    localStorage.setItem('score', JSON.stringify(this.Score));
  }

  getTotalpoints() {
    this.modalService.open(this.totalPointsModal).result.then(result => {
      this.totalpoints = result;
      localStorage.setItem('totalScore', result);
    }, () => this.getTotalpoints());
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
}