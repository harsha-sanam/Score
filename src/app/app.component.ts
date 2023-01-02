import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

import { ModalDismissReasons, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Score';
  newPlayer: string;
  Players: string[] = [];
  distributor: number = 0;
  closeResult = '';
  totalpoints: number = 0;
  rejoinPlayers: number[] = [];
  rejoinedPlayers: number[] = [];
  Score: any = {};

  ppp: number[] = [];

  @ViewChild('totalPoints', { static: true }) totalPointsModal: TemplateRef<any>;
  @ViewChild('rejoin', { static: true }) rejoinModal: TemplateRef<any>;


  constructor(private modalService: NgbModal) { }

  ngOnInit() {
    this.Players = JSON.parse(localStorage.getItem('players')) ? JSON.parse(localStorage.getItem('players')) : [];
    this.Score = JSON.parse(localStorage.getItem('score'));
    this.totalpoints = localStorage.getItem('totalScore') ? Number(localStorage.getItem('totalScore')) : 0;
    if (!this.Score) {
      this.InitScore();
    }
    if (this.totalpoints == 0)
      this.getTotalpoints();
    console.log(this.Players);
    console.log(this.Score);

  }

  AddScore() {
    if (this.Players && this.Players.length > 0) {
      for (var i = 0; i < this.Players.length; i++) {
        var score = Number((<HTMLInputElement>document.getElementById(this.Players[i])).value);
        this.Score.Scores[this.Players[i]].push(score);
        (<HTMLInputElement>document.getElementById(this.Players[i])).value = "";
      }
      this.Score.Games = this.Score.Games + 1;

      this.checkRejoin();
      this.updateScore();
      this.nextDistributor();
    }
    else {
      alert('Add players before adding score');
    }

  }
  checkRejoin() {

    this.rejoinPlayers = [];
    var highestScore = -1;
    for (var i = 0; i < this.Players.length; i++) {
      var sum = this.sum(this.Players[i]);
      if (sum >= this.totalpoints) {
        this.rejoinPlayers.push(i);
        continue;
      }
      if (sum < this.totalpoints && highestScore < sum) {
        highestScore = sum;
      }
    }

    console.log('Highest Score', highestScore);

    if (this.rejoinPlayers.length == 0) { return; }


    this.modalService.open(this.rejoinModal, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        this.rejoinPlayers = []; 
        this.rejoin(this.rejoinedPlayers, highestScore);
      },
      () => {
        this.checkRejoin();
      },
    );
  }
  onChange(p: number, isChecked: boolean) {
    if (isChecked) {
      this.rejoinedPlayers.push(p);
    } else {
      let index = this.rejoinedPlayers.indexOf(p);
      this.rejoinedPlayers.splice(index, 1);
    }
    this.rejoinedPlayers = [...new Set(this.rejoinedPlayers)];
  }

  rejoin(players: number[], highestScore: number) {

    if(players == null || players.length == 0){
      return;
    }

    for (var i = 0; i < this.Players.length; i++) {
      if (!players.includes(i)) {
        this.Score.Scores[this.Players[i]].push(0);
        //console.log('pushing',0);
      }
      else {
        this.Score.Scores[this.Players[i]].push((this.sum(this.Players[i]) - highestScore - 1) * -1);
        //console.log('pushing', (this.sum(this.Players[i]) - highestScore - 1) * -1);
      }
    }
    this.rejoinedPlayers=[];
  }

  nextDistributor() {
    this.distributor = (this.distributor + 1) % this.Players.length;
  }
  ClearStorage() {
    localStorage.clear();
  }
  AddPlayer() {
    if (!this.newPlayer || this.newPlayer == '' || this.newPlayer == ' ') {
      return;
    }
    if (this.Score.Games && this.Score.Games != 0 && !confirm("All Data will be lost")) {
      return;
    }
    if (this.Players.indexOf(this.newPlayer) >= 0) {
      return;
    }
    this.Players.push(this.newPlayer);
    this.newPlayer = "";
    this.updatePlayers();
    this.InitScore();
    this.distributor = this.Players.length - 1;
  }
  InitScore() {
    this.Score = {};
    this.Score.Scores = {};
    this.Score.Games = 0;
    for (var i = 0; i < this.Players.length; i++) {
      this.Score.Scores[this.Players[i]] = [];
    }
    this.updateScore();
  }
  sum(player: string) {
    return this.Score.Scores[player] ? this.Score.Scores[player].reduce(function (a, b) {
      return a + b;
    }, 0) : null;
  }
  DeleteScore() {
    var isRejoin = false;
    for (var i = 0; i < this.Players.length; i++) {
      if(this.Score.Scores[this.Players[i]][this.Score.Scores[this.Players[i]].length-1] < 0){isRejoin = true;}
      this.Score.Scores[this.Players[i]].pop();
    }
    if(!isRejoin){ this.Score.Games--; this.distributor = (this.distributor + this.Players.length - 1) % this.Players.length;}
    this.checkRejoin();
    this.updateScore();    
  }
  RemovePlayer(player: string) {
    this.Players = this.Players.filter(a => a.toLowerCase() != player.toLowerCase());
    this.updatePlayers();
  }

  updatePlayers() {
    localStorage.setItem('players', JSON.stringify(this.Players));
  }
  updateScore() {
    localStorage.setItem('score', JSON.stringify(this.Score));
  }

  getTotalpoints() {
    this.modalService.open(this.totalPointsModal, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        this.totalpoints = result;
        localStorage.setItem('totalScore', result);
      },
      () => {
        this.getTotalpoints();
      },
    );
  }
}

